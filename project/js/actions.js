/*global Annotator*/
/*global paper*/


const actions = {
    addAnnotation: function (path, group) {
        const me = {
            name: "Commit Annotation",
            actionGroup: "annotations",
            actionType: "add",
            path: path,
            group: group,
            done: false,
            do: function () {
                if (me.done === false) {
                    me.path.visible = true;
                    me.path.selected = true;
                    me.path.opacity = 1.0;
                    me.path.style = {};
                    me.group.addChild(me.path);
                    Annotator.updateGroup(group);
                    me.done = true;
                }
            },

            undo: function () {
                if (me.done === true){
                    me.path.visible = false;
                    me.path.remove();
                    me.done = false;
                }
            }
        }
        return me;
    },

    deleteAnnotations: function(paths){
        const me = {
            name: "Delete Annotation",
            actionGroup: "annotations",
            actionType: "edit",
            paths: paths,
            done: false,

            do: function () {
                if (me.done === false) {
                    me.paths.forEach(function (path){
                        path.removedFrom = path.parent;
                        path.remove();
                    });

                    me.done = true;
                }
            },

            undo: function () {
                if (me.done === true){
                    me.paths.forEach(function (path){
                        path.removedFrom.addChild(path);
                    });

                    me.done = false;
                }
            }
        }
        return me;
    }
}