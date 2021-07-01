roles = {
    admin: {
        annotations: {
            view: true,
            add: true,
            edit: true,
            comment: true
        },
        components: {
            view: true,
            add: true,
            edit: true
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
    },
    annotator: {
        annotations: {
            view: true,
            add: true,
            edit: true,
            comment: true
        },
        components: {
            view: true,
            add: false,
            edit: false
        },
        metadata: {
            view: true,
            edit: false
        },
        reports:{
            create: true,
            view: true,
            comment: true
        }
    },
    viewer: {
        annotations: {
            view: true,
            add: false,
            edit: false,
            comment: false
        },
        components: {
            view: true,
            add: false,
            edit: false
        },
        metadata: {
            view: true,
            edit: false
        },
        reports:{
            create: false,
            view: true,
            comment: true
        }
    }
}