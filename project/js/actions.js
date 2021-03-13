/*global Annotator*/
/*global paper*/


const actions = {
    addAnnotation: function (path, group) {
        const me = {
            name: "Commit Annotation",
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
                    paper.view.draw();
                    me.done = true;
                }
            },

            undo: function () {
                if (me.done === true){
                    me.path.visible = false;
                    me.path.remove();
                    paper.view.draw();
                    me.done = false;
                }
            }
        }
        return me;
    },

    deleteAnnotations: function(paths){
        const me = {
            name: "Delete Annotation",
            paths: paths,
            done: false,

            do: function () {
                if (me.done === false) {
                    me.paths.forEach(function (path){
                        path.removedFrom = path.parent;
                        path.remove();
                    });

                    paper.view.draw();
                    me.done = true;
                }
            },

            undo: function () {
                if (me.done === true){
                    me.paths.forEach(function (path){
                        path.removedFrom.addChild(path);
                    });

                    paper.view.draw();
                    me.done = false;
                }
            }
        }
        return me;
    }
}