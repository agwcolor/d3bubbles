var width = 2000,
  height = 2000,
  padding = 1.5, // separation between same-color nodes
  clusterPadding = 20, // separation between different-color nodes
  maxRadius = 100;
minRadius = 10;


// Create SVG and padding for the chart
const svg = d3
  .select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
;

/* Make responsive
var margin = {
  top: 20,
  right: 20,
  bottom: 30,
  left: 40
}

default_width = 1500 - margin.left - margin.right;
default_height = 1500 - margin.top - margin.bottom;
default_ratio = default_width / default_height;

// Determine current size, which determines vars
function set_size() {
  current_width = window.innerWidth;
  current_height = window.innerHeight;
  current_ratio = current_width / current_height;

  // desktop ratio
  if (current_ratio > default_ratio) {
    h = default_height;
    w = default_width;
  // mobile
  } else {
   margin.left = 20;
   w = current_width;
   h = w / default_ratio;
  }
  // Set new width and height taking margin into account
  width = w - 50 - margin.right;
  height = h - margin.top - margin.bottom;
};

set_size();
 End make responsive */


d3.csv("skills.csv", function(data) {
  //calculate the maximum group present
  m = d3.max(data, function(d){return d.group});
  //create the color categories
  color = d3.scale.category20()
  .domain(d3.range(m));
  //make the cluster array each cluster for each group
  clusters = new Array(m);
  
  dataset = data.map(function(d) {
  //find the radius entered in the csv
  var r = parseInt(d.radius);

    var dta = {
      cluster: d.group,//group
      name: d.name,//label
      radius: r,//radius
      x: Math.cos(d.group / m * 2 * Math.PI) * 100 + width / 2 + Math.random(),
      y: Math.sin(d.group / m * 2 * Math.PI) * 100 + height / 2 + Math.random()
    };
    //add the one off the node inside teh cluster
    if (!clusters[d.group] || (d.radius > clusters[d.group].radius)) clusters[d.group] = dta;
    return dta;
  });
  //after mapping use that to make the graph
  makeGraph(dataset);
});


//this will make the graph from nodes

function makeGraph(nodes) {
  var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(.02)
    .charge(0)
    .on("tick", tick)
    .start();

  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

  var node = svg.selectAll("circle")
    .data(nodes)
    .enter().append("g").call(force.drag);

  //add circle to the group
  node.append("circle")
    .style("fill", function(d) {
      return color(d.cluster);
    }).attr("r", function(d) {
      return d.radius
    })

  //add text to the group
  node.append("text")
    .text(function(d) {
      return d.name;
    })
    .attr("dx", -10)
    .attr("dy", ".35em")
    .style("stroke", "none")
    .call(wrap, 150);

  function tick(e) {
    node.each(cluster(10 * e.alpha * e.alpha))
      .each(collide(.5))
      //.attr("transform", functon(d) {});
      .attr("transform", function(d) {
        var k = "translate(" + d.x + "," + d.y + ")";
        return k;
      })
  }

  // Move d to be adjacent to the cluster node.
  function cluster(alpha) {
    return function(d) {
      var cluster = clusters[d.cluster];
      if (cluster === d) return;
      var x = d.x - cluster.x,
        y = d.y - cluster.y,
        l = Math.sqrt(x * x + y * y),
        r = d.radius + cluster.radius;
      if (l != r) {
        l = (l - r) / l * alpha;
        d.x -= x *= l;
        d.y -= y *= l;
        cluster.x += x;
        cluster.y += y;
      }
    };
  }

  // Resolves collisions between d and all other circles.
  function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function(d) {
      var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }

  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", -60).attr("y", -50).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", -70).attr("y", -50).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }
}