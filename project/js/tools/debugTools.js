/*global Annotator*/
/*global paper*/
/*global Voronoi*/

function createRandomAnnotations(n, flattenError=500) {
    // function generateBeeHivePoints(size, loose) {
    //     var points = [];
    //     var col = paper.view.size.divide(size);
    //     for (var i = -1; i < size.width + 1; i++) {
    //         for (var j = -1; j < size.height + 1; j++) {
    //             var point = new paper.Point(i, j).divide(new paper.Point(size));
    //             point = point.multiply(paper.view.size).add(col.divide(2));
    //             if (j % 2)
    //                 point = point.add(new paper.Point(col.width / 2, 0));
    //             if (loose)
    //                 point = point.add(col.divide(4).multiply(paper.Point.random()).subtract(col.divide(4)));
    //             points.push(point);
    //         }
    //     }
    //     return points;
    // }

    function generateRandomPoints(n) {
        var points = [];
        for (var i = 0; i < n; i++) {
            var point = paper.Point.random().multiply(paper.view.size);
            points.push(point);
        }
        return points;
    }

    function createPath(points, center) {
        Annotator.startNewPath(new paper.Path())
        let path = Annotator.currentPath
        path.closed = true;

        for (var i = 0, l = points.length; i < l; i++) {
            var point = points[i];
            var next = points[(i + 1) === points.length ? 0 : i + 1];
            var vector = (next.subtract(point)).divide(2);
            path.add({
                point: point.add(vector),
                handleIn: vector.multiply(-1),
                handleOut: vector
            });
        }
        path.scale(0.95);
        path.flatten(flattenError);
        //removeSmallBits(path);
        var tags = Annotator.tags.children
        Annotator.currentTag = tags[Math.floor(Math.random() * tags.length)];
        Annotator.addAnnotation();
        return path;
    }

    function removeSmallBits(path) {
        var averageLength = path.length / path.segments.length;
        var min = path.length / 50;
        for(var i = path.segments.length - 1; i >= 0; i--) {
            var segment = path.segments[i];
            var cur = segment.point;
            var nextSegment = segment.next;
            var next = nextSegment.point + nextSegment.handleIn;
            if (cur.getDistance(next) < min) {
                segment.remove();
            }
        }
    }

    // var sites = generateBeeHivePoints(paper.view.size.divide(2000), true);
    var sites = generateRandomPoints(n);
    var voronoi =  new Voronoi();

    var diagram = voronoi.compute(
        sites,
        {
            xl: 0,
            xr: Annotator.full_image_width,
            yt: 0,
            yb: Annotator.full_image_height
        }
    );
    var currentTag = Annotator.currentTag;
    if (diagram) {
        for (var i = 0, l = sites.length; i < l; i++) {
            var cell = diagram.cells[sites[i].voronoiId];
            if (cell) {
                var halfedges = cell.halfedges,
                    length = halfedges.length;
                if (length > 2) {
                    var points = [];
                    for (var j = 0; j < length; j++) {
                        v = halfedges[j].getEndpoint();
                        points.push(new paper.Point(v));
                    }
                    createPath(points, sites[i]);
                }
            }
        }
    }
    Annotator.currentTag = currentTag;
}