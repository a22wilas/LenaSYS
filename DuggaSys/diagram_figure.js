function drawSegment(pathA,p1, p2) {
    pathA.addsegment(1,p1,p2);
    return pathA;
}

var figurePath = new Path;
var isFirstPoint = true;
var startPosition;
var numberOfPointsInFigure = 0;

function createFigure() {
	if(uimode == "CreateFigure" && md == 4) {
		p1 = null;
		if(isFirstPoint) {
			p2 = points.addpoint(cx, cy, false);
			startPosition = p2;
			isFirstPoint = false;
		} else {
			// Read and set the values for p1 and p2
			p1 = p2;
			if(activePoint != null) {
				p2 = activePoint;
			} else {
				p2 = points.addpoint(cx, cy, false);
			}
			// Check if the new point is the starting point
			if (points[startPosition].x == points[p2].x &&
				points[startPosition].y == points[p2].y) {
				// Delete al previous rendered lines
				for (var i = 0; i < numberOfPointsInFigure; i++) {
					diagram.pop();
				}
				// Render the figure
				figurePath.addsegment(1, p1, p2);
				diagram.push(figurePath);
				// Clean up
				figurePath = new Path;
				startPosition = null;
				uimode = null;
				isFirstPoint = true;
				numberOfPointsInFigure = 0;
			} else {
				// Temporary store the new line and then render it
				var tempPath = new Path;
				tempPath.addsegment(1, p1, p2);
				diagram.push(tempPath);
				// Save the new line to the figure
				figurePath.addsegment(1, p1, p2);
				numberOfPointsInFigure++;
			}
		}
	}
}