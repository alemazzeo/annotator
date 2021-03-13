/*global paper*/
/*global OpenSeadragon*/

const Annotator = (function () {
    const me = {
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

        init: function (hierarchy, config) {
            if (config) {
                if (config.startConfig) {
                    me.startConfig = {
                        ...me.startConfig, ...config.startConfig
                    }
                }
                if (config.userConfig) {
                    me.userConfig = {
                        ...me.userConfig, ...config.userConfig
                    }
                }
            }

            document.onkeypress = me.onKeypress;

            me.initLayout();
            me.initToolbars();
            me.initSidebar();
            me.initOpenSeaDragon();

            me.tags = new paper.Group({name: "tags"});
            me.loadTags(hierarchy, me.tags);
            me.currentTag = me.tags.children[0];
            me.fillSidebar(me.tags);
        },

        viewHistory: function(){
            let history = [""];
            me.actionsHistory.forEach(function (action, i){
                if (i === me.currentActionPointer){
                    history.push(i + " - " + action.name + " <-- ")
                } else {
                    history.push(i + " - " + action.name)
                }

            });
            console.log(history.join("\n"));
        },

        do: function(action){
            me.actionsHistory = me.actionsHistory.slice(
                0, me.currentActionPointer + 1
            );
            me.actionsHistory.push(action);
            me.currentActionPointer = me.actionsHistory.indexOf(action)
            action.do();
        },

        redo: function(){
            let action = me.actionsHistory[me.currentActionPointer + 1];
            if (action) {
                action.do();
                me.currentActionPointer += 1;
            }
        },

        undo: function(){
            let action = me.actionsHistory[me.currentActionPointer];
            if (action) {
                action.undo();
                me.currentActionPointer -= 1;
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

        pressHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mousePress) {
                me.tools[me.currentTool].mousePress(event);
            }
            paper.view.draw();
        },

        clickHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mouseClick) {
                me.tools[me.currentTool].mouseClick(event);
            }
            paper.view.draw();
        },

        dragHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mouseDrag) {
                me.tools[me.currentTool].mouseDrag(event);
            }
            paper.view.draw();
        },

        dragEndHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mouseDragEnd) {
                me.tools[me.currentTool].mouseDragEnd(event);
            }
            paper.view.draw();
        },

        moveHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mouseMove) {
                me.tools[me.currentTool].mouseMove(event);
            }
            paper.view.draw();
        },

        dblClickHandler: function (event) {
            if (me.tools[me.currentTool] && me.tools[me.currentTool].mouseDblClick) {
                me.tools[me.currentTool].mouseDblClick(event);
            }
            paper.view.draw();
        },

        initToolbars: function () {
            me.tools = {
                ...me.tools,
                ...me.startConfig.toolbarTools,
            };

            me.startConfig.toolbarToolsOrder.forEach(function (tool_name) {
                if (me.tools[tool_name] && me.tools[tool_name].toolbar) {
                    w2ui['layout_main_toolbar'].insert(
                        me.tools[tool_name].toolbar.break,
                        me.tools[tool_name].toolbar.config
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
                    {type: 'right', title: "Anotador", size: 400, resizable: true},
                    {type: 'main', title: "Anotaciones", toolbar: me.initViewerToolbar()},
                ]
            });
        },

        initSidebar: function () {
            w2ui.layout.content('right', $().w2sidebar(
                {
                    name: 'sidebar',
                    style: 'font-weight: bold',
                    onClick: function (event) {
                        me.currentTag = event.node.paperGroup;
                    }
                }));
            w2ui.layout.content('main', "<div id=\"osd_viewer\" style=\"width: 100%; height:100%;\"</div>");
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
                        text: 'Vistas disponibles',
                        icon: 'fa fa-layer-group',
                        items: [],
                    },
                ],
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

            me.viewer.addTiledImage({
                tileSource: "http://openseadragon.github.io/example-images/highsmith/highsmith.dzi",
                x: 0,
                y: 0,
            });

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
                        "h_tag_" + group.data.parents[group.data.level-1]
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
                                        function(path){
                                            path.selected = true;
                                        }
                                    )
                                    n.nodes.forEach(function (sn) {
                                        _selectAll(sn);
                                    })
                                }
                                _selectAll(node);
                                paper.view.draw();
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
            paper.view.draw();
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
            button.nodes.forEach(function (item){
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