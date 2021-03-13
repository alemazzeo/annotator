/*global Annotator*/
/*global paper*/


var osdTools = {
    home: (function () {
        return {
            toolbar: {
                break: 'break-osd',
                config: {
                    type: 'button',
                    id: 'home',
                    text: '',
                    icon: 'fa fa-home',
                    onClick: function () {
                        Annotator.viewer.viewport.goHome()
                    }
                }
            },
        };
    }()),

    zoomIn: (function () {
        return {
            toolbar: {
                break: 'break-osd',
                config: {
                    type: 'button',
                    id: 'zoomIn',
                    text: '',
                    icon: 'fa fa-search-plus',
                    onClick: function () {
                        Annotator.viewer.viewport.zoomBy(2);
                    }
                }
            },
        };
    }()),

    zoomOut: (function () {
        return {
            toolbar: {
                break: 'break-osd',
                config: {
                    type: 'button',
                    id: 'zoomOut',
                    text: '',
                    icon: 'fa fa-search-minus',
                    onClick: function () {
                        Annotator.viewer.viewport.zoomBy(0.5);
                    }
                }
            },
        };
    }()),
}

