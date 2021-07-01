const API_URL = "https://anotrs.42ideas.biz/api/v1/"
const FS_URL = "https://anotrs.42ideas.biz/samples/"

function startAnnotator(){
    w2popup.lock("Cargando...", true);

    let sample = w2ui["startForm"].record["sample"].text;
    console.log(sample);
    let jsonURL = FS_URL + sample + "/sample.json";
    const getSampleJSON = new XMLHttpRequest();
    getSampleJSON.open("GET", jsonURL, true);
    getSampleJSON.onload = function () {
        let data = JSON.parse(getSampleJSON.response);
        let dziFiles = [];
        if (data.dziFiles) {
            dziFiles = [
                ...data.dziFiles
            ]
        } else if (data.layers) {
            data.layers.forEach(function (item){
                dziFiles = [
                    ...dziFiles,
                    {
                        name: item["name"],
                        dzi: item["filename"],
                        pixelSize: item["pixel_size"]
                    }
                ]
            });
        } else {
            console.log("El JSON no contiene DZIs", data);
        }
        // const getLayers = new XMLHttpRequest();
        w2popup.unlock();
        w2popup.close();

        Annotator.init({
            roles: {
                ...w2ui["startForm"].record["roles"]
            },
            userConfig: {
                hierarchyStyles: {
                    'Clasto': {
                        fillColor: 'red',
                    },
                    'Cemento': {
                        fillColor: 'yellow',
                    },
                    'Poro': {
                        fillColor: 'blue',
                    },
                    'Matriz': {
                        fillColor: 'green',
                    },
                }
            }
        });

        Annotator.loadSample({
            folder: FS_URL + sample + "/",
            metadata: {
                "sample.type": [
                    {id: "Testigo", text: "Testigo"},
                    {id: "Izquierdo", text: "Izquierdo"}
                ],
                "sample.code": "[Codigo de la muestra]",
                "sample.depth": 1234.56,
                "well.acronym": "[Sigla del pozo]"
            },
            dziFiles: dziFiles
        })
        Annotator.startAnnotations(w2ui["startForm"].record["user"], hierarchy);

    };
    getSampleJSON.send();
}


function updateSamples(){
    w2popup.lock("Consultado muestras", true);
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function () {
        w2ui["startForm"].set("sample", {
            options: {
                items: [
                    ...JSON.parse(xhttp.response).data
                ]
            }
        })
        w2popup.unlock();
        w2ui["startForm"].refresh();
    }

    xhttp.open("GET", API_URL + "/samples", true);
    xhttp.send();
}

if (!w2ui.startForm) {
    $().w2form({
        name: 'startForm',
        style: 'border: 0px; background-color: transparent;',
        fields: [
            {
                field: 'user',
                type: 'text',
                required: true,
                html: {
                    page: 0,
                    group: "Usuario",
                    label: "Nombre",
                    attr: 'style="width: 200px"'
                }
            },
            {
                field: 'sample',
                type: 'list',
                required: true,
                options: {
                    items: []
                },
                html: {
                    page: 0,
                    group: "Muestra",
                    label: "Código",
                }
            },
            {
                field: 'roles.annotations.view',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 0,
                    group: "Permisos de anotación",
                    label: "Ver",
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.annotations.add',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 0,
                    label: "Agregar",
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.annotations.edit',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 0,
                    label: 'Editar',
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.annotations.comment',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 0,
                    label: 'Comentar',
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.metadata.view',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 0,
                    group: 'Permisos de metadata',
                    label: 'Ver',
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.metadata.edit',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 0,
                    label: 'Editar',
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.components.view',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 1,
                    group: 'Permisos de componentes',
                    label: 'Ver',
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.components.add',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 1,
                    label: 'Agregar',
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.components.edit',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 1,
                    label: 'Editar',
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.reports.create',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 1,
                    group: 'Permisos de reportes',
                    label: 'Crear',
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.reports.view',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 1,
                    label: 'Ver',
                    span: 4,
                    attr: '',
                },
            },
            {
                field: 'roles.reports.comment',
                type: 'toggle',
                html: {
                    page: 1,
                    column: 1,
                    label: 'Comentar',
                    span: 4,
                    attr: '',
                },
            },
        ],
        record: {
            user: "Default",
            roles: {
                annotations: {
                    view: true,
                    add: true,
                    edit: true,
                    comment: true
                },
                components: {
                    view: true,
                    add: true,
                    edit: true,
                },
                metadata: {
                    view: true,
                    edit: true
                },
                reports:{
                    create: true,
                    view: true,
                    comment: true
                }
            }
        },
        tabs: [
            { id: 'tab1', text: 'General' },
            { id: 'tab2', text: 'Editar permisos' },
            { id: 'tab3', text: 'Personalización' }
        ],
        actions: {
            "Continuar": function () {
                if (this.validate().length === 0){
                    startAnnotator();
                };
            }
        }
    });
}
w2popup.open({
    title   : 'Inicio manual',
    body    : '<div id="form" style="width: 100%; height: 100%;"></div>',
    style   : 'padding: 15px 0px 0px 0px',
    width   : 500,
    height  : 700,
    showClose: false,
    showMax: false,
    modal: true,
    onToggle: function (event) {
        $(w2ui.startForm.box).hide();
        event.onComplete = function () {
            $(w2ui.startForm.box).show();
            w2ui.startForm.resize();
        }
    },
    onOpen: function (event) {
        event.onComplete = function () {
            $('#w2ui-popup #form').w2render('startForm');
            updateSamples()
        }
    }
});