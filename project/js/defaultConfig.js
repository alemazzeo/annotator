startConfig = {
    osdViewer: {
        animationTime: 0.5,
        blendTime: 0.1,
        maxZoomPixelRatio: 2,
        minZoomLevel: 0.5,
        visibilityRatio: 1,
        zoomPerScroll: 2,
        zoomPerClick: 1,
    },
    toolbarTools: {
        ...configTools,
        ...osdTools,
        ...AnnotationTools,
    },
    toolbarToolsOrder: [
        'editConfig',
        'home',
        'zoomIn',
        'zoomOut',
        'undo',
        'redo',
        'hand',
        'selectPointer',
        'freeDraw',
        'polygonDraw',
        'circleArea',
        'eraser',
        'visibility'
    ],
    startTool: 'hand',
}

userConfig = {
    baseStyle: {
        fillColor: 'white',
        strokeColor: 'black',
        strokeWidth: 20,
    },
    opacity: 0.5,
    subOpacity: 1.0,
    hierarchyStyles: null,
}