/*global paper*/
/*global OpenSeadragon*/

const Annotator = (function () {
    const me = {
        role: "admin",
        startConfig: startConfig,
        userConfig: userConfig,
        userId: 0,
        viewer: null,
        overlay: null,
        actionsHistory: [],
        currentActionPointer: 0,
        currentPath: null,
        currentTool: null,
        selectedTool: null,
        currentTagGroup: null,
        currentTag: null,
        toolbar: null,
        tools: {},
        hierarchy: null,
        mDrag: null,
        tags: null,
        full_image_height: null,
        full_image_width: null,
        currentUser: null,
        currentSample: null,
        layers: {},
        currentItemTooltip: null,

        init: function (config) {
            me.roles = {
                ...config.roles
            };
            me.startConfig = {
                ...me.startConfig, ...config.startConfig
            }
            me.userConfig = {
                ...me.userConfig, ...config.userConfig
            }

            document.onkeypress = me.onKeypress;

            me.initLayout();
            me.initToolbars();
            me.initSidebar();
            me.initOpenSeaDragon();
        },

        startAnnotations: function (name, hierarchy) {
            if (!me.layers[name]) {
                me.layers[name] = new paper.Layer({name: name});
                me.layers[name].annotations = []
                me.tags = me.layers[name].addChild(new paper.Group({name: "tags"}));
                if (hierarchy) {
                    me.loadTags(hierarchy, me.tags);
                    me.currentTag = me.tags.children[0];
                    me.fillSidebar(me.tags);
                }
            } else {
                console.log("ERROR")
            }

        },

        loadAnnotations: function (json_data) {
            let loadLayer = paper.Layer.importJSON(json_data);
            me.layers[loadLayer.name] = loadLayer;
            me.tags = loadLayer.children.tags;
            me.currentTag = me.tags.children[0];
            me.fillSidebar(me.tags);
        },

        saveState: function (name) {
            me.layers[name].data.full_image_height = me.full_image_height;
            me.layers[name].data.full_image_width = me.full_image_width;
            return me.layers[name].exportJSON()
        },

        exportAnnotations: function (layerName) {
            let annotations = []
            me.layers[layerName].children.tags.children.forEach(function (group){
                group.children.forEach(function (path){
                    let segments = []
                    path.segments.forEach(function (item){
                        segments.push([item.point.x, item.point.y])
                    })
                    annotations.push({
                        groupId: group.data.id,
                        segments: segments
                    })
                });
            });
            return annotations
        },

        importAnnotations: function (layerName, annotations) {
            let layer = me.layers[layerName];
            annotations.forEach(function (x){
                let group = layer.children.tags.getItem({name: "tag_" + x.groupId});
                let path = new paper.Path(x.segments);
                path.closed = true;
                path.style = {...me.userConfig.baseStyle}
                path.style.strokeWidth = me.adjustByZoom(
                    me.userConfig.baseStrokeWidth
                );
                group.addChild(path);
                me.updateGroup(group);
            })
            me.updateView();
        },

        loadSample: function (sample) {
            let layerMenu = w2ui['layout_main_toolbar'].get("layerMenu");
            me.currentSample = sample;
            me.openDZI(me.currentSample.dziFiles[0]);
            me.currentSample.dziFiles.forEach(function (item, i) {
                layerMenu.items.push({
                    id: item.dzi,
                    text: item.name,
                    checked: i === 0,
                    pixelSize: item.pixelSize
                })
            })
            layerMenu.selected = me.currentSample.dziFiles[0].dzi;
            me.tools["editSample"].record = me.currentSample.metadata;

        },

        viewHistory: function () {
            let history = [""];
            me.actionsHistory.forEach(function (action, i) {
                if (i === me.currentActionPointer) {
                    history.push(i + " - " + action.name + " <-- ")
                } else {
                    history.push(i + " - " + action.name)
                }

            });
            console.log(history.join("\n"));
        },

        checkRoles: function (requested) {
            let result = true;
            Object.keys(requested).forEach(function (actionGroup) {
                Object.keys(requested[actionGroup]).forEach(function (actionType) {
                    if (me.roles[actionGroup][actionType] === false) {
                        result = false;
                    }
                });
            });
            return result
        },

        do: function (action) {
            if (me.roles[action.actionGroup][action.actionType] === false) {
                alert(
                    "Denied action: " + action.actionType + " " +
                    action.actionGroup
                );
                return;
            }
            me.actionsHistory = me.actionsHistory.slice(
                0, me.currentActionPointer + 1
            );
            me.actionsHistory.push(action);
            me.currentActionPointer = me.actionsHistory.indexOf(action)
            action.do();
            Annotator.updateView();
        },

        redo: function () {
            let action = me.actionsHistory[me.currentActionPointer + 1];
            if (action) {
                action.do();
                me.currentActionPointer += 1;
                Annotator.updateView();
            }
        },

        undo: function () {
            let action = me.actionsHistory[me.currentActionPointer];
            if (action) {
                action.undo();
                me.currentActionPointer -= 1;
                Annotator.updateView();
            }
        },

        addAnnotation: function () {
            me.do(
                actions.addAnnotation(me.currentPath, me.currentTag)
            );
        },

        deleteSelected: function () {
            let pathsToDelete = [];
            paper.project.getItems({selected: true, class: paper.Path}).forEach(
                function (path) {
                    pathsToDelete.push(path);
                }
            )
            me.deleteAnnotations(pathsToDelete)
        },

        deleteAnnotations: function (paths) {
            me.do(
                actions.deleteAnnotations(paths)
            )
        },

        startNewPath: function (path) {
            let group = me.currentTag;
            me.currentPath = path;
            me.currentPath.style = {...me.userConfig.baseStyle}
            me.currentPath.style.strokeWidth = me.adjustByZoom(
                me.userConfig.baseStrokeWidth
            );
            me.currentPath.opacity = me.userConfig.opacity;
        },

        updateGroup: function (group) {
            let cascadeStyle = {
                ...me.userConfig.baseStyle,
                ...group.data.style
            }
            group.data.parents.forEach(function (id) {
                cascadeStyle = {
                    ...cascadeStyle,
                    ...me.tags.children["tag_" + id].data.style
                }
            })
            cascadeStyle = {...cascadeStyle, ...group.data.style}
            group.style = {...cascadeStyle};
        },

        setCurrentItemTooltip: function (item) {
            if (me.currentItemTooltip === item) {
                return;
            }
            me.currentItemTooltip = item;


            let style = "\"" +
                "margin: 0; " +
                "padding-left: 10px;" +
                "padding-right: 10px;" +
                //"font-family:'Lucida Console', monospace;" +
                "position: absolute; " +
                "top: 50%; " +
                "-ms-transform: translateY(-50%); " +
                "transform: translateY(-50%);\"";

            let itemName;

            if (me.currentItemTooltip !== null) {
                itemName = me.getItemFullName(me.currentItemTooltip);
            } else {
                itemName = "";
            }

            w2ui.layout.html(
                'bottom',
                "<div style=" + style + ">" + itemName + "</div>"
            );
        },

        getItemFullName: function (item) {
            let fullname = "";
            item.parent.data.parents.forEach(function (parent_id) {
                fullname += me.tags.getItem({name: "tag_" + parent_id}).data.name + " -> ";
            });
            fullname += item.parent.data.name;
            return fullname;
        },

        pressHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mousePress) {
                me.tools[me.currentTool].mousePress(event);
            }
        },

        clickHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mouseClick) {
                me.tools[me.currentTool].mouseClick(event);
            }
        },

        dragHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mouseDrag) {
                me.tools[me.currentTool].mouseDrag(event);
            }
        },

        dragEndHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mouseDragEnd) {
                me.tools[me.currentTool].mouseDragEnd(event);
            }
        },

        moveHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mouseMove) {
                me.tools[me.currentTool].mouseMove(event);
            }
        },

        dblClickHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mouseDblClick) {
                me.tools[me.currentTool].mouseDblClick(event);
            }
        },

        updateView: function () {
            paper.view.update();
        },

        initToolbars: function () {
            me.tools = {
                ...me.tools,
                ...me.startConfig.toolbarTools,
            };

            me.startConfig.toolbarToolsOrder.forEach(function (tool_name) {
                if (me.tools[tool_name] && me.tools[tool_name].toolbar) {
                    let disable = false;
                    if (me.tools[tool_name].toolbar.roles) {
                        if (!me.checkRoles(me.tools[tool_name].toolbar.roles)) {
                            disable = true;
                        }
                    }
                    w2ui['layout_main_toolbar'].insert(
                        me.tools[tool_name].toolbar.break,
                        {
                            disabled: disable,
                            ...me.tools[tool_name].toolbar.config
                        }
                    )
                    if (me.tools[tool_name].toolbar.config.onLoad) {
                        me.tools[tool_name].toolbar.config.onLoad();
                    }
                }
            })
            me.currentTool = me.startConfig.startTool;
            w2ui['layout_main_toolbar'].check(me.currentTool)
        },

        initLayout: function () {
            $('#annotator').w2layout({
                name: 'layout',
                panels: [
                    {
                        type: 'right',
                        title: "Anotador",
                        size: 400,
                        resizable: true,
                    },
                    {
                        type: 'main',
                        title: "Anotaciones",
                        toolbar: me.initViewerToolbar()
                    },
                    {
                        type: 'bottom',
                        size: 40
                    }
                ]
            });
        },

        initSidebar: function () {
            w2ui.layout.html('right', $().w2sidebar(
                {
                    name: 'sidebar',
                    style: 'font-weight: bold',
                    onClick: function (event) {
                        me.currentTag = event.node.paperGroup;
                    }
                }));
            w2ui.layout.html(
                'main',
                "<div id=\"osd_viewer\" style=\"width: 100%; height:100%;\"</div>"
            );
        },

        initViewerToolbar: function () {
            return {
                name: 'viewertoolbar',
                items: [
                    {type: "break", id: "break-config"},
                    {type: "break", id: "break-osd"},
                    {type: "break", id: "break-undo"},
                    {type: "break", id: "break-annotations"},
                    {type: "spacer"},
                    {
                        type: 'menu-radio',
                        id: 'layerMenu',
                        count: 1,
                        text: 'Canales',
                        icon: 'fa fa-layer-group',
                        items: [],
                    },
                ],
                onClick: function(event){
                    if (event.subItem){
                        if (event.item.id === "layerMenu"){
                            me.openDZI({
                                name: event.subItem.text,
                                dzi: event.subItem.id,
                                pixelSize: event.subItem.pixelSize
                            });
                        }
                    }
                }
            }
        },

        initOpenSeaDragon: function () {
            me.viewer = new OpenSeadragon({

                crossOriginPolicy: "Anonymous",
                id: "osd_viewer",
                prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
                debugMode: false,
                preserveViewport: true,
                showNavigator: true,
                showNavigationControl: false,
                constrainDuringPan: true,
                showRotationControl: true,
                ...me.startConfig.osdViewer,
            });

            me.overlay = me.viewer.paperjsOverlay();

            me.viewer.scalebar({
                type: OpenSeadragon.ScalebarType.MICROSCOPY,
                pixelsPerMeter: 0.8 * 1e6,
                minWidth: "75px",
                location: OpenSeadragon.ScalebarLocation.BOTTOM_LEFT,
                xOffset: 5,
                yOffset: 10,
                stayInsideImage: true,
                color: "rgb(150, 150, 150)",
                fontColor: "rgb(20, 20, 20)",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                fontSize: "medium",
                barThickness: 2
            });

            me.viewer.scalebarInstance.divElt.style.pointerEvents = `none`;

            new OpenSeadragon.MouseTracker({
                element: me.viewer.canvas,
                pressHandler: me.pressHandler,
                clickHandler: me.clickHandler,
                dragHandler: me.dragHandler,
                dragEndHandler: me.dragEndHandler,
                dblClickHandler: me.dblClickHandler,
                nonPrimaryPressHandler: function (event) {
                    if (event.button === 1) {
                        me.mDrag = {
                            lastPos: event.position.clone()
                        };
                    }
                },
                moveHandler: function (event) {
                    let viewport = me.viewer.viewport
                    if (me.mDrag) {
                        let deltaPixels = me.mDrag.lastPos.minus(event.position);
                        let deltaPoints = viewport.deltaPointsFromPixels(deltaPixels);
                        viewport.panBy(deltaPoints);
                        me.mDrag.lastPos = event.position.clone();
                    }

                    me.moveHandler(event);
                },
                nonPrimaryReleaseHandler: function (event) {
                    if (event.button === 1) {
                        me.mDrag = null;
                    }
                }
            }).setTracking(true);

            me.viewer.world.addHandler("add-item", me._onViewerOpen);
            me.viewer.addHandler("zoom", me._onViewerZoom);
        },

        openDZI: function (dziItem) {
            console.log(dziItem);
            me.viewer.scalebar({pixelsPerMeter: 1 / dziItem.pixelSize});
            me.viewer.open(me.currentSample.folder + dziItem.dzi);
        },

        _onViewerZoom: function () {
            me.tags.style.strokeWidth = me.adjustByZoom(
                me.userConfig.baseStrokeWidth
            );
            let zoom = me.viewer.viewport.getZoom(false);
            if (zoom < 1.0) {
                paper.settings.handleSize = 8;
            } else {
                paper.settings.handleSize = 8;
            }

        },

        adjustByZoom: function (baseSize, bounds) {
            let zoom = me.viewer.viewport.getZoom(false);
            let newSize;
            if (zoom > 1.0) {
                newSize = baseSize / zoom;
            } else {
                newSize = baseSize;
            }
            if (bounds) {
                if (bounds.minSize) {
                    if (newSize < bounds.minSize) {
                        newSize = bounds.minSize;
                    }
                }
                if (bounds.maxSize) {
                    if (newSize > bounds.maxSize) {
                        newSize = bounds.maxSize;
                    }
                }
            }
            return newSize
        },

        _onViewerOpen: function () {
            me.full_image_width = me.viewer.world.getItemAt(0).getContentSize().x;
            me.full_image_height = me.viewer.world.getItemAt(0).getContentSize().y;
        },

        loadTags: function (hierarchy, container) {
            hierarchy.forEach(function (item) {
                let group = me.makeGroup(item.id, item.name, item.parents_ids);
                container.addChild(group);
            });
        },

        makeGroup: function (id, name, parents) {
            let level = parents.length;
            return new paper.Group({
                name: "tag_" + id,
                opacity: me.userConfig.opacity,
                data: {
                    id: id,
                    name: name,
                    level: level,
                    style: {
                        ...me.userConfig.hierarchyStyles[name]
                    },
                    parents: parents
                }
            });
        },

        fillSidebar: function (parentGroup) {
            parentGroup.children.forEach(function (group) {
                let newSidebarButton;
                let parent;
                let node = {
                    id: "h_" + group.name,
                    text: "...",
                    paperGroup: group
                }
                if (group.data.level === 0) {
                    node.style = 'font-weight: normal';
                    newSidebarButton = w2ui.sidebar.add([node]);
                } else {
                    parent = w2ui.sidebar.get(
                        "h_tag_" + group.data.parents[group.data.level - 1]
                    )
                    newSidebarButton = w2ui.sidebar.insert(parent, null, [node])
                }
                me.sideBarButtonAddContextMenu(newSidebarButton);

            });

            w2ui.sidebar.select(w2ui.sidebar.nodes[0].id);
            w2ui.sidebar.click(w2ui.sidebar.nodes[0].id);
            w2ui.sidebar.nodes.forEach(function (button) {
                me.refreshSidebarButton(button);
            })

        },

        sideBarButtonAddContextMenu: function (button) {
            button.onContextMenu = function () {
                $("#node_" + button.id).w2menu({
                    items: [
                        {
                            id: "m1",
                            text: 'Mostrar todos',
                            icon: 'fa fa-eye',
                            action: function (node) {
                                me.toggleVisibleAll(node, true);
                                me.refreshSidebarButton(node);
                            }
                        },
                        {
                            id: "m2",
                            text: 'Ocultar todos',
                            icon: 'fa fa-eye-slash',
                            action: function (node) {
                                me.toggleVisibleAll(node, false);
                                me.refreshSidebarButton(node);
                            }
                        },
                        {
                            id: "m3",
                            text: '--'
                        },
                        {
                            id: "m4",
                            text: 'Seleccionar todos',
                            icon: 'fa fa-object-ungroup',
                            action: function (node) {
                                function _selectAll(n) {
                                    n.paperGroup.getItems({class: paper.Path}).forEach(
                                        function (path) {
                                            path.selected = true;
                                        }
                                    )
                                    n.nodes.forEach(function (sn) {
                                        _selectAll(sn);
                                    })
                                }

                                _selectAll(node);
                                paper.view.update();
                                me.viewer.canvas.focus();
                            }
                        },
                    ],
                    onSelect: function (event) {
                        event.item.action(button);
                    }
                });
            }
        },

        refreshSidebarButton: function (button) {
            w2ui.sidebar.lock('', true);
            button.text = button.paperGroup.data.name + me.sidebarButtons(button, button.paperGroup);
            me.updateGroup(button.paperGroup);
            w2ui.sidebar.refresh(button.id);
            button.nodes.forEach(function (subButton) {
                if (subButton.nodes) {
                    me.refreshSidebarButton(subButton);
                }
            })
            paper.view.update();
            w2ui.sidebar.unlock();
        },

        sidebarButtons: function (button) {
            let style = `
                border-color: none; 
                border-radius: 5px; 
                background-color: white; 
                padding: 2px; 
                width: 25px;
            `;

            let visibleIcon;
            let colorValue;
            let colorIcon;

            if (button.paperGroup.visible) {
                visibleIcon = 'fa fa-eye';
            } else {
                visibleIcon = 'fa fa-eye-slash';
            }

            if (button.paperGroup.data.style.fillColor) {
                colorIcon = 'fa fa-stop';
                colorValue = button.paperGroup.data.style.fillColor;
            } else {
                colorIcon = 'fa fa-arrow-circle-up';
                let parentColor;
                let g;
                button.paperGroup.data.parents.forEach(function (id) {
                    g = me.tags.children["tag_" + id];
                    if (g.data.style.fillColor) {
                        parentColor = g.data.style.fillColor;
                    }
                })
                if (parentColor) {
                    colorValue = parentColor;
                } else {
                    console.log('ESTO NO DEBERIA PASAR PERO PASO');
                }
            }

            return `
               <div style="float: right;">
                    <button class="${colorIcon}"
                            style="${style} color: ${colorValue};"
                            onClick="Annotator.showColor(this, '${button.id}')"/>
                    <button class="${visibleIcon}" 
                            style="${style}"
                            onClick="Annotator.toggleVisibility('${button.id}')"/>
                </div>
            `;
        },

        toggleVisibleAll(button, state) {
            button.paperGroup.visible = state;
            button.nodes.forEach(function (item) {
                let group = item.paperGroup;
                group.visible = state;
                me.toggleVisibleAll(item, state);
            })
        },

        toggleVisibility: function (buttonId) {
            let button = w2ui.sidebar.get(buttonId);
            let group = button.paperGroup;
            group.visible = !group.visible;
            me.refreshSidebarButton(button);
        },

        showColor: function (obj, buttonId) {
            let button = w2ui.sidebar.get(buttonId);
            let group = button.paperGroup;
            $(obj).w2color(
                {color: 'EA9899', transparent: true},
                function (color) {
                    if (color) {
                        group.data.style.fillColor = "#" + color;
                    } else {
                        if (color === "") {
                            let baseConfig = me.userConfig.hierarchyStyles[group.data.name]

                            if (baseConfig) {
                                if (baseConfig.fillColor) {
                                    group.data.style.fillColor = baseConfig.fillColor;
                                }
                            } else {
                                if (group.data.style.fillColor) {
                                    delete group.data.style.fillColor;
                                }
                            }
                        }
                    }
                    me.refreshSidebarButton(button);
                }
            )
        },

        onKeypress: function (event) {
            let key = event.key.toLowerCase();
            let shift = event.shiftKey;
            let ctrl = event.ctrlKey;
            if (key === 'delete' && !ctrl && !shift) {
                me.deleteSelected();
            } else if (key === 'z' && ctrl && !shift) {
                me.undo();
            } else if (key === 'z' && ctrl && shift) {
                me.redo();
            }
        }
    };
    return me;
}());