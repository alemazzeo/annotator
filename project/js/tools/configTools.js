/*global Annotator*/
/*global paper*/
/*global config*/


var configTools = {
    editConfig: (function () {
        const me = {
            layout: null,
            form: null,
            popup: null,
            toolbar: {
                break: 'break-config',
                config: {
                    type: 'button',
                    id: 'editConfig',
                    text: '',
                    icon: 'fa fa-wrench',
                    onClick: function () {
                        me.openConfig();
                    },
                    onLoad: function () {
                        $().w2form(me.configForm);
                    }
                }
            },
            configSidePanel: {
                name: 'configSidebar',
                style: 'font-weight: bold',
                onClick: function (event) {
                    me.currentComponent = event.node;
                }
            },
            configForm: {
                name: 'configForm',
                tabs: [
                    { id: 'tab1', caption: 'General' },
                    { id: 'tab2', caption: 'Anotaciones'},
                ],
                fields: [
                    {
                        field: 'field1',
                        type: 'float',
                        required: true,
                        html: {
                            page: 0,
                            label: 'Campo 1',
                            attr: 'style="width: 100px"'}
                    },
                    {
                        field: 'field2',
                        type: 'text',
                        required: true,
                        html: {
                            page: 0,
                            label: 'Campo 2',
                            attr: 'style="width: 100px"'}
                    },
                    {
                        field: 'field3',
                        type: 'text',
                        required: true,
                        html: {
                            page: 1,
                            label: 'Campo 3',
                            attr: 'style="width: 100px"'}
                    },
                ],
                actions: {
                    'Aplicar': function (event) {
                        console.log(this.getChanges());
                        w2popup.close();
                    },
                    'Deshacer cambios': function (event) {
                        this.clear();
                    }
                },
            },

            openConfig: function () {
                w2popup.open({
                    title   : 'Configuración del anotador',
                    width   : 900,
                    height  : 600,
                    showMax : true,
                    body    : '<div id="divConfigPopup" style="' +
                        'position: absolute; ' +
                        'left: 5px; ' +
                        'top: 5px; ' +
                        'right: 5px; ' +
                        'bottom: 5px;">' +
                        '</div>',
                    onOpen  : function (event) {
                        event.onComplete = function () {
                            $('#w2ui-popup #divConfigPopup').w2render('configForm');
                        };
                    },
                });
            },
        };
        return me;
    }()),

    editSample: (function () {
        const me = {
            layout: null,
            form: null,
            popup: null,
            record: {},
            toolbar: {
                break: 'break-config',
                config: {
                    type: 'button',
                    id: 'editSample',
                    text: '',
                    icon: 'fa fa-edit',
                    onClick: function () {
                        me.openConfig();
                    },
                    onLoad: function () {
                        $().w2form(me.metadataForm);
                    }
                }
            },
            metadataForm: {
                name: 'metadataForm',
                fields: [
                    ...sampleMetadataFields
                ],
                actions: {
                    'Aplicar': function (event) {
                        console.log(this.getChanges());
                        w2popup.close();
                    },
                    'Deshacer cambios': function (event) {
                        this.clear();
                    }
                },
            },

            openConfig: function () {
                w2popup.open({
                    title   : 'Metadata de la muestra',
                    width   : 500,
                    height  : 700,
                    showMax : true,
                    body    : '<div id="divConfigPopup" style="' +
                        'position: absolute; ' +
                        'left: 5px; ' +
                        'top: 5px; ' +
                        'right: 5px; ' +
                        'bottom: 5px;">' +
                        '</div>',
                    onOpen  : function (event) {
                        event.onComplete = function () {
                            $('#w2ui-popup #divConfigPopup').w2render('metadataForm');
                            w2ui["metadataForm"].record = me.record;
                            w2ui["metadataForm"].refresh();
                            console.log(me.record);
                        };
                    },
                });
            },
        };
        return me;
    }()),
}

