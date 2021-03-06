var defoptions = {
    stackHeight : 12,
    radius : 5,
    fontSize : 14,
    labelFontSize : 8,
    labelLineSpacing: 2.5,
    nodeLabel : null,
    markerWidth : 0,
    markerHeight : 0,
    gap : 1.5,
    nodeResize : "",
    linkDistance : 80,
    charge : -120,
    styleColumn : null,
    styles : null,
    linkName : null,
    nodeFocus: true,
    nodeFocusRadius: 25,
    nodeFocusColor: "FireBrick",
    labelOffset: 5,
    gravity: .05,
    routeFocusStroke: "FireBrick",
    routeFocusStrokeWidth: 3,
    circleFill: "Black",
    routeStroke: "Black",
    routeStrokeWidth: 1,
    width : $("#diagram").outerWidth(),
    height : $("#diagram").outerHeight()
};

var newoptions = {nodeLabel:"label", nodeResize:"count", height:700, nodeFocus:true, radius:3, charge:-500};

function initTheTreeViz (skema) {

    options = $.extend(defoptions, newoptions);
    options.gap = options.gap * options.radius;
    diagram.width = options.width;
    diagram.height = options.height;
    diagram.scratch = $(document.createElement('span'))
        .addClass('shadow')
        .css('display','none')
        .css("font-size",options.labelFontSize + "px");   
    $('body').append(diagram.scratch);

    var initPromise = $.Deferred();
    getPromise(diagram,skema).then(function (data) {

        diagram.data = data;
        diagram.nodes = data.nodes;
        diagram.links = data.links;
        diagram.color = d3.scale.category20();
    
        diagram.svg = d3.select("#diagram")
            .append("svg:svg")
            .attr("width", diagram.width)
            .attr("height", diagram.height);
        
        diagram.force = d3.layout.force().
            size([diagram.width, diagram.height])
            .linkDistance(options.linkDistance)
            .charge(options.charge)
            .gravity(options.gravity);

        initPromise.resolve(diagram);
    });
    return initPromise.promise();
}

function doTheTreeViz(diagram) {

    var svg = diagram.svg;
    var force = diagram.force;
    var pads = ["shadow", "stroke", "text", "circle", "link", "node"];

    force.nodes(diagram.nodes)
        .links(diagram.links)
        .start();

    // Update the nodes
    var node = svg.selectAll("g.node")
        .data(diagram.nodes, function(d) {return d.key;});

    // Enter any new nodes.
    var nodeEnter = node.enter()
        .append("svg:g")
            .attr("class", "node")
            .style("cursor", "pointer")
            //.attr("id", function(d,i) {return getId(d,i,this);})
            .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";})
            .on("dblclick", function(d){draw.dblclick(d);})
        .call(force.drag);

    node.select("circle")
        .attr("class", "circle")
        .style("cursor", "pointer")
        .attr("r", function(d) {return getRadius(d);})
        .style("fill", function(d) {return getColor(d);})
        //.attr("id", function(d,i) {return getId(d,i,this);});

    nodeEnter
        .append("svg:circle")
            .attr("class", "circle")
            .style("cursor", "pointer")
            .attr("r", function(d) {return getRadius(d);})
            .style("fill", function(d) {return getColor(d);})
            .on("mouseover", function(d){enhanceNode (d);})
            .on("mouseout", function(d){resetNode(d);})
            //.attr("id", function(d,i) {return getId(d,i,this);})
        .append("svg:title")
            .text(function(d) {return d[options.nodeLabel];});

    // Update the links
    var link = svg.selectAll("line.link")
        .data(diagram.links, function(d) {return d.key;});
 
    // Enter any new links
    var linkEnter = link.enter()
        .insert("svg:line", ".node")
            .attr("class", "link")
            .style("cursor", "pointer")
            .attr("x1", function(d) {return d.source.x;})
            .attr("y1", function(d) {return d.source.y;})
            .attr("x2", function(d) {return d.target.x;})
            .attr("y2", function(d) {return d.target.y;})
            //.attr("id", function(d,i) {return getId(d,i,this);})
        .append("svg:title")
            .text(function(d) {return d.target.name + ":" + d.source.name ;});

    if (options.nodeLabel) {
       // text is done once for shadow as well as for text
        var textShadow = nodeEnter.append("svg:text")
            .attr("dy", ".31em")
            .attr("class", "shadow")
            .attr("id", function(d,i) {return getId(d,i,this);})
            .style("font-size",options.labelFontSize + "px")
            .attr("text-anchor", function(d) {return !d.right? 'start' : 'start' ;})
            .attr("x", function(d) {var x = (d.right || !d.fixed)? 
                options.labelOffset: (-d.dim.width - options.labelOffset); return x;})
            .text(function(d) {return d.shortName? d.shortName : d.name;});

        // enhance all the links that end here
        var text = nodeEnter.append("svg:text")
            .attr("dy", ".35em")
            .attr("class", "text")
            .attr("id", function(d,i) {return getId(d,i,this);})
            .attr("text-anchor", function(d) {return !d.right? 'start' : 'start' ;})
            .style("font-size",options.labelFontSize + "px")
            .attr("x", function(d) {var x = (d.right || !d.fixed)? 
                options.labelOffset: (-d.dim.width - options.labelOffset);return x;})
            .text(function(d) {return d.shortName? d.shortName : d.name;})
            .on("mouseover", function(d){enhanceNode (d); d3.select(this).style('fill',options.routeFocusStroke);})
            .on("mouseout", function(d){resetNode(d);});
    }

    if (options.linkName) {
        link.append("title")
            .text(function(d) {
                return d[options.linkName];
        });
    }

    // Exit any old links and nodes.
    link.exit().remove(); node.exit().remove();
    diagram.link = svg.selectAll("line.link");
    diagram.node = svg.selectAll("g.node");
    force.on("tick", tick);

    function enhanceNode(selectedNode) {
        link.filter (function (d) {return d.source.key == selectedNode.key || d.target.key == selectedNode.key;})
            .attr("class", "stroke")
            .style("stroke", options.routeFocusStroke)
            .attr("id", function(d,i) {return getId(d,i,this);})
            .style("stroke-width", options.routeFocusStrokeWidth);
        
        if (text) {
            text.filter (function (d) {return areWeConnected (selectedNode,d);})
                .style("fill", options.routeFocusStroke);
        }
    }

    function areWeConnected (node1,node2) {
        for (var i=0; i < diagram.data.links.length ; i++) {
            var lnk = diagram.data.links[i];
            if ( (lnk.source.key === node1.key && lnk.target.key === node2.key) ||
                 (lnk.source.key === node2.key && lnk.target.key === node1.key) ) return lnk;
        }
        return null;
    }

    function resetNode(selectedNode) {
        link.style("stroke", options.routeStroke)
            .style("stroke-width", options.routeStrokeWidth);
        if (text) {
            text.style("fill", options.routeStroke);
        }
    }

    function tick() {
        link.attr("x1", function(d) {return d.source.x;})
            .attr("y1", function(d) {return d.source.y;})
            .attr("x2", function(d) {return d.target.x;})
            .attr("y2", function(d) {return d.target.y;});
        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }

    function getId(d,i,e) {
        var pad = pads.indexOf($(e).attr('class'));
        var s = String(i); while (s.length < (pad || 6)) {s = "0" + s;}
        return s;
    }

    function getColor(d) {
        return options.nodeFocus && d.isCurrentlyFocused? 
            options.nodeFocusColor  : diagram.color(d.group) ;
    }
 
    function getRadius(d) {
        return makeRadius(diagram,d);
    }
}

function makeRadius(diagram,d) {
     var r = options.radius * (options.nodeResize? Math.sqrt(d[options.nodeResize]) / Math.PI : 1);
     return options.nodeFocus && d.isCurrentlyFocused? options.nodeFocusRadius  : r;
}

function makeFilteredData(diagram,selectedNode){
    // we'll keep only the data where filterned nodes are the source or target
    var newNodes = [];
    var newLinks = [];

    for (var i = 0; i < diagram.data.links.length ; i++) {
        var link = diagram.data.links[i];
        if (link.target.isCurrentlyFocused || link.source.isCurrentlyFocused) {
            newLinks.push(link);
            addNodeIfNotThere(link.source,newNodes);
            addNodeIfNotThere(link.target,newNodes);
        }
    }

    // if none are selected reinstate the whole dataset
    if (newNodes.length > 0) {
        diagram.links = newLinks;
        diagram.nodes = newNodes;
    }
    else {
        diagram.nodes = diagram.data.nodes;
        diagram.links = diagram.data.links;
    }
    return diagram;
    
    function addNodeIfNotThere( node, nodes) {
        for ( var i=0; i < nodes.length; i++) {
            if (nodes[i].key == node.key) return i;
        }
        return nodes.push(node) -1;
    }
}

function getPixelDims(scratch,t) {
    // scratch is an elemen with the correct styling, t is the text to be counted in pixels
    scratch.empty();
    scratch.append(document.createTextNode(t));
    return {width: scratch.outerWidth(), height: scratch.outerHeight() } ;
}

function getPromise(diagram,data) {
    var massage = $.Deferred();
    massage.resolve ( dataMassage (diagram,data));    
    return massage.promise();
}

function dataMassage(diagram,data) {
    var ind = data, nodes = [],links =[];
    // the tags are to be circles
    for (var i=0;i<ind.length;i++) {
        ind[i].isCurrentlyFocused = false;
        nodes.push(ind[i]);
       // add links to pages
       for ( var j=0; j < ind[i].pages.length; j++) {
           //push this page as a node
           var node = findOrAddPage(diagram,ind[i].pages[j],nodes);
           node.isCurrentlyFocused = false;
           // create a link
           var link = {source:node , target:ind[i], key : node.key + "_" + ind[i].key };
           links.push(link);
       }
   }

   // sort nodes alpha
   nodes.sort (function (a,b) {return a.name < b.name? -1 : (a.name == b.name? 0 : 1 ) ;});
   diagram.pageCount = 0;
   diagram.pageRectSize = {width:0,height:0,radius:0};   
   for ( var i = 0; i < nodes.length ; i++) {
       page= nodes[i];
       page.group =0;
       page.dim = getPixelDims(diagram.scratch, page.name);
       if (page.fixed) {
           diagram.pageCount++;
          // this will calculate the width/height in pixels of the largest label
           diagram.pageRectSize.width = Math.max(diagram.pageRectSize.width,page.dim.width);
           diagram.pageRectSize.height = Math.max(diagram.pageRectSize.height,page.dim.height);
           diagram.pageRectSize.radius = Math.max(diagram.pageRectSize.radius,makeRadius(diagram,page));
           page.group =1;    
       }
       
   }

    // we're going to fix the nodes that are pages into two columns
    for ( var i = 0, c=0; i < nodes.length ; i++) {
        var page = nodes[i];
        if (page.fixed) {
            page.right= (c > diagram.pageCount/2);
            // y dimension calc same for each column
            page.y = ((c % (diagram.pageCount/2)) + .5) * (diagram.pageRectSize.height)  ;
            
            // x based on right or left column
            page.x = page.right? 
                diagram.width - diagram.pageRectSize.width - options.labelOffset  :
                page.dim.width + options.labelOffset ;
            c++;
        }
    }
    return {nodes: nodes, links: links };
}

function findOrAddPage(diagram,page,nodes) {
    for ( var i=0;i<nodes.length;i++) {
        if ( nodes[i].key === page.key ) {
            nodes[i].count++;
            return nodes[i];
        }
    }
    page.fixed = true;
    page.count = 0;
    return nodes[nodes.push(page) - 1];
}
