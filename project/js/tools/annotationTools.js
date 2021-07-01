/*global Annotator*/
/*global paper*/


var AnnotationTools = {
    undo: (function () {
        return {
            toolbar: {
                break: 'break-undo',
                config: {
                    type: 'button',
                    id: 'undo',
                    text: '',
                    icon: 'fa fa-undo',
                    onClick: function () {
                        Annotator.undo();
                    }
                }
            }
        }
    }()),

    redo: (function () {
        return {
            toolbar: {
                break: 'break-undo',
                config: {
                    type: 'button',
                    id: 'redo',
                    text: '',
                    icon: 'fa fa-redo',
                    onClick: function () {
                        Annotator.redo();
                    }
                }
            }
        }
    }()),

    hand: (function () {
        return {
            toolbar: {
                break: 'break-annotations',
                config: {
                    type: 'radio',
                    id: 'hand',
                    group: 'annotation',
                    text: '',
                    icon: 'fa fa-hand-paper',
                    onClick: function () {
                        Annotator.viewer.container.style.cursor = "move"
                        Annotator.currentTool = 'hand';
                    }
                }
            },

            mousePress: function (event) {
                Annotator.viewer.setMouseNavEnabled(true);
            },

            mouseDrag: function (event) {
                Annotator.viewer.setMouseNavEnabled(true);
            },

            mouseDragEnd: function (event) {
                Annotator.viewer.setMouseNavEnabled(true);
            },
        };
    }()),

    selectPointer: (function () {
        return {
            startPoint: null,
            dragging: false,
            toolbar: {
                break: 'break-annotations',
                config: {
                    type: 'radio',
                    id: 'selectPointer',
                    group: 'annotation',
                    text: '',
                    icon: 'fa fa-mouse-pointer',
                    onClick: function () {
                        Annotator.viewer.container.style.cursor = "crosshair"
                        Annotator.currentTool = 'selectPointer';
                    }
                }
            },

            mouseClick: function (event) {
                if (this.dragging === false) {
                    if (event.originalEvent.shiftKey === false) {
                        Annotator.tags.selected = false;
                    }

                    let x = event.position.x;
                    let y = event.position.y;
                    let newPoint = paper.view.viewToProject(new paper.Point(x, y));

                    let hitResult = paper.project.hitTest(newPoint);
                    if (hitResult) {
                        hitResult.item.selected = true;
                        Annotator.updateView();
                    }

                    Annotator.viewer.setMouseNavEnabled(true);
                } else {
                    this.dragging = false;
                }
            },

            mousePress: function (event) {
                if (event.originalEvent.shiftKey === false) {
                    Annotator.tags.selected = false;
                }

                Annotator.viewer.setMouseNavEnabled(false);
                let x = event.position.x;
                let y = event.position.y;
                this.startPoint = paper.view.viewToProject(new paper.Point(x, y));
            },

            mouseDrag: function (event) {
                if (this.dragging) {
                    Annotator.currentPath.remove();
                    if (event.originalEvent.shiftKey === false) {
                        Annotator.tags.selected = false;
                    }
                }

                let x = event.position.x;
                let y = event.position.y;
                let newPoint = paper.view.viewToProject(new paper.Point(x, y));

                Annotator.startNewPath(new paper.Path.Rectangle(
                    this.startPoint,
                    newPoint
                ));

                this.dragging = true;

                Annotator.currentPath.opacity = 1.0;

                let style = {
                    fillColor: null,
                    strokeColor: 'black',
                }

                let selected = paper.project.getItems({
                    class: paper.Path,
                    inside: Annotator.currentPath.bounds
                })

                if (newPoint.x < this.startPoint.x){
                    let zoom = Annotator.viewer.viewport.getZoom(false)
                    let dash = 50 / zoom;
                    style.dashArray = [dash, dash];
                    selected = [
                        ...selected,
                        ...paper.project.getItems({
                            class: paper.Path,
                            overlapping: Annotator.currentPath.bounds
                        })
                    ];
                }

                selected.forEach(function (path) {
                    path.selected = true;
                })

                Annotator.currentPath.style = {
                    ...Annotator.currentPath.style,
                    ...style
                }
                Annotator.updateView();
                Annotator.viewer.setMouseNavEnabled(false);
            },

            mouseDragEnd: function (event) {
                Annotator.currentPath.remove();
                Annotator.updateView();
                Annotator.viewer.setMouseNavEnabled(true);
            },

            mouseMove: function (event) {
                if (!this.dragging) {
                    let x = event.position.x;
                    let y = event.position.y;
                    let newPoint = paper.view.viewToProject(new paper.Point(x, y));

                    let hitResult = paper.project.hitTest(newPoint);
                    if (hitResult) {
                        Annotator.setCurrentItemTooltip(hitResult.item);
                    } else {
                        Annotator.setCurrentItemTooltip(null);
                    }
                }
            }
        };
    }()),

    freeDraw: (function () {
        return {
            toolbar: {
                break: 'break-annotations',
                roles: {
                    annotations: {
                        add: true
                    }
                },
                config: {
                    type: 'radio',
                    id: 'freeDraw',
                    group: 'annotation',
                    text: '',
                    icon: 'fa fa-pencil-alt',
                    onClick: function () {
                        Annotator.viewer.container.style.cursor = "default"
                        Annotator.currentTool = 'freeDraw';
                    }
                }
            },
            firstPoint: null,
            lastPoint: null,
            tolerance: 200,
            started: false,

            mousePress: function (event) {
                Annotator.tags.selected = false;

                if (Annotator.currentTag) {
                    Annotator.startNewPath(new paper.Path())

                    let x = event.position.x;
                    let y = event.position.y;
                    let newPoint = paper.view.viewToProject(new paper.Point(x, y));
                    Annotator.currentPath.add(newPoint);
                    this.firstPoint = Annotator.currentPath.lastSegment.point;
                    this.lastPoint = Annotator.currentPath.lastSegment.point;
                    Annotator.currentPath.add(newPoint);
                    Annotator.updateView();
                    this.started = true;
                }
                Annotator.setCurrentItemTooltip(null);
            },

            mouseDrag: function (event) {
                Annotator.viewer.setMouseNavEnabled(false);
                if (Annotator.currentPath && this.started) {
                    let x = event.position.x;
                    let y = event.position.y;

                    let newPoint = paper.view.viewToProject(new paper.Point(x, y));
                    let distanceFirst = newPoint.subtract(this.firstPoint).length;
                    let distanceLast = newPoint.subtract(this.lastPoint).length;
                    let zoom = Annotator.viewer.viewport.getZoom(false)

                    if (distanceLast > this.tolerance / zoom) {

                        if (distanceFirst < this.tolerance / zoom) {
                            Annotator.currentPath.lastSegment.point = newPoint;
                        } else {
                            Annotator.currentPath.lastSegment.point = newPoint;
                            this.lastPoint = Annotator.currentPath.lastSegment.point;
                            Annotator.currentPath.add(newPoint);
                        }
                    } else {
                        Annotator.currentPath.lastSegment.point = newPoint;
                    }
                    this.started = true;
                    Annotator.updateView();
                }
            },

            mouseDragEnd: function (event) {

                if (Annotator.currentPath) {
                    Annotator.currentPath.lastSegment.remove();
                    Annotator.currentPath.closed = true;
                }
                this.started = false;
                Annotator.addAnnotation();
                Annotator.updateView();
                Annotator.viewer.setMouseNavEnabled(true);
            },

            mouseMove: function (event) {
                if (!this.started) {
                    let x = event.position.x;
                    let y = event.position.y;
                    let newPoint = paper.view.viewToProject(new paper.Point(x, y));

                    let hitResult = paper.project.hitTest(newPoint);
                    if (hitResult) {
                        Annotator.setCurrentItemTooltip(hitResult.item);
                    } else {
                        Annotator.setCurrentItemTooltip(null);
                    }
                }
            }
        };
    }()),

    polygonDraw: (function () {
            return {
                toolbar: {
                    break: 'break-annotations',
                    roles: {
                        annotations: {
                            add: true
                        }
                    },
                    config: {
                        type: 'radio',
                        id: 'polygonDraw',
                        group: 'annotation',
                        text: '',
                        icon: 'fa fa-draw-polygon',
                        onClick: function () {
                            Annotator.viewer.container.style.cursor = "default"
                            Annotator.currentTool = 'polygonDraw';
                        }
                    }
                },
                started: false,

                mousePress: function (event) {
                    Annotator.tags.selected = false;

                    let x = event.position.x;
                    let y = event.position.y;
                    let newPoint = paper.view.viewToProject(new paper.Point(x, y));

                    if (!this.started) {
                        Annotator.startNewPath(new paper.Path())
                        this.started = true;
                        Annotator.currentPath.add(newPoint);
                    }

                    Annotator.currentPath.add(newPoint);
                    Annotator.updateView();
                    Annotator.viewer.setMouseNavEnabled(false);
                    Annotator.setCurrentItemTooltip(null);
                },

                mouseMove: function (event) {
                    if (this.started) {
                        let x = event.position.x;
                        let y = event.position.y;
                        let newPoint = paper.view.viewToProject(new paper.Point(x, y));
                        Annotator.currentPath.lastSegment.point = newPoint;
                        Annotator.updateView();
                    } else {
                        let x = event.position.x;
                        let y = event.position.y;
                        let newPoint = paper.view.viewToProject(new paper.Point(x, y));

                        let hitResult = paper.project.hitTest(newPoint);
                        if (hitResult) {
                            Annotator.setCurrentItemTooltip(hitResult.item);
                        } else {
                            Annotator.setCurrentItemTooltip(null);
                        }
                    }
                },

                mouseDblClick: function (event) {
                    if (this.started) {
                        Annotator.currentPath.lastSegment.remove();
                        Annotator.currentPath.lastSegment.remove();
                        Annotator.currentPath.lastSegment.remove();
                        Annotator.currentPath.closed = true;
                        this.started = false;
                        Annotator.viewer.setMouseNavEnabled(true);
                        Annotator.addAnnotation();
                        Annotator.updateView();
                    }
                },
            };
        }()
    ),

    circleArea: (function () {
            return {
                toolbar: {
                    break: 'break-annotations',
                    roles: {
                        annotations: {
                            add: true
                        }
                    },
                    config: {
                        type: 'radio',
                        id: 'circleArea',
                        group: 'annotation',
                        text: '',
                        icon: 'fa fa-dot-circle',
                        onClick: function () {
                            Annotator.viewer.container.style.cursor = "default"
                            Annotator.currentTool = 'circleArea';
                        }
                    },
                },
                center: null,
                dragging: false,

                mousePress: function (event) {
                    Annotator.tags.selected = false;
                    if (Annotator.currentTag) {
                        Annotator.viewer.setMouseNavEnabled(false);
                        let x = event.position.x;
                        let y = event.position.y;
                        this.center = paper.view.viewToProject(new paper.Point(x, y));
                    }
                    Annotator.setCurrentItemTooltip(null);
                },

                mouseDrag: function (event) {
                    if (Annotator.currentPath) {
                        if (Annotator.currentTag) {

                            if (this.dragging) {
                                Annotator.currentPath.remove();
                            }

                            let x = event.position.x;
                            let y = event.position.y;
                            let newPoint = paper.view.viewToProject(new paper.Point(x, y));
                            Annotator.startNewPath(new paper.Path.Circle({
                                center: this.center,
                                radius: newPoint.subtract(this.center).length,
                                dashArray: [2, 2],
                                strokeColor: 'black',
                            }));
                            this.dragging = true;

                            Annotator.addAnnotation();
                            Annotator.viewer.setMouseNavEnabled(false);
                        }
                    }
                },

                mouseDragEnd: function (event) {

                    if (Annotator.currentTag) {
                        if (this.dragging) {
                            Annotator.currentPath.remove();
                        }

                        let x = event.position.x;
                        let y = event.position.y;
                        let newPoint = paper.view.viewToProject(new paper.Point(x, y));
                        Annotator.startNewPath(new paper.Path.Circle({
                            center: this.center,
                            radius: newPoint.subtract(this.center).length,
                        }));


                    }
                    Annotator.viewer.setMouseNavEnabled(true);
                    this.center = null;
                    this.dragging = false;
                    Annotator.addAnnotation();
                },

                mouseMove: function (event) {
                    if (!this.dragging) {
                        let x = event.position.x;
                        let y = event.position.y;
                        let newPoint = paper.view.viewToProject(new paper.Point(x, y));

                        let hitResult = paper.project.hitTest(newPoint);
                        if (hitResult) {
                            Annotator.setCurrentItemTooltip(hitResult.item);
                        } else {
                            Annotator.setCurrentItemTooltip(null);
                        }
                    }
                }

            };
        }()
    ),

    eraser: (function () {
        return {
            toolbar: {
                break: 'break-annotations',
                roles: {
                    annotations: {
                        add: true
                    }
                },
                config: {
                    type: 'radio',
                    id: 'eraser',
                    group: 'annotation',
                    text: '',
                    icon: 'fa fa-eraser',
                    onClick: function () {
                        Annotator.viewer.container.style.cursor = "default"
                        Annotator.currentTool = 'eraser';
                    }
                }
            },

            mousePress: function (event) {
                let hit_item = null;
                let x = event.position.x;
                let y = event.position.y;
                var point = paper.view.viewToProject(new paper.Point(x, y));
                var hit_test_result = paper.project.hitTest(point);
                if (hit_test_result) {
                    Annotator.deleteAnnotations([hit_test_result.item])
                }
                Annotator.setCurrentItemTooltip(null);
            },

            mouseMove: function (event) {
                let x = event.position.x;
                let y = event.position.y;
                let newPoint = paper.view.viewToProject(new paper.Point(x, y));

                let hitResult = paper.project.hitTest(newPoint);
                if (hitResult) {
                    Annotator.setCurrentItemTooltip(hitResult.item);
                } else {
                    Annotator.setCurrentItemTooltip(null);
                }
            }
        };
    }()),
};