/* global d3, _ */

(function() {
  var margin = {top: 60, right: 20, bottom: 70, left: 75},
    margin2  = {top: 360, right: 20, bottom: 20, left: 75};

  var width    =  window.innerWidth - margin.left - margin.right - 20, // -20 for the margin
      height   = 400 - margin.top - margin.bottom,
      height_date_slider  = 400 - margin2.top - margin2.bottom;

  var parseDate = d3.time.format('%d/%m/%Y').parse,
      legendFormat = d3.time.format('%b %d, %Y');

  var x = d3.time.scale().range([0, width]),
      y = d3.scale.linear().range([height, 0]),
      x_volume  = d3.time.scale().range([0, width]),
      y_volume  = d3.scale.linear().range([height, height-40]),
      x_date_slider  = d3.time.scale().range([0, width]),
      y_date_slider  = d3.scale.linear().range([height_date_slider, 0]);

  var x_axis   = d3.svg.axis().scale(x).orient('bottom'),
      y_axis   = d3.svg.axis().scale(y).orient('left'),
      x_date_slider_axis  = d3.svg.axis().scale(x_date_slider).orient('bottom');

  var priceLine = d3.svg.line()
    .interpolate('monotone')
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.price); });

  var avgLine = d3.svg.line()
    .interpolate('monotone')
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.average); });

  var svg = d3.select('body').append('svg')
    .attr('class', 'chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom + 60);

  svg.append('defs').append('clipPath')
    .attr('id', 'clip')
  .append('rect')
    .attr('width', width)
    .attr('height', height);

  var make_y_axis = function () {
    return d3.svg.axis()
                    .scale(y)
                    .orient('left')
                    .ticks(3);
  };

  var focus = svg.append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var barsGroup = svg.append('g')
    .attr('class', 'volume')
    .attr('clip-path', 'url(#clip)')
    .attr('transform', 'translate(' + margin.left + ',' + (margin.top + 60 + 20) + ')');

  var context = svg.append('g')
    .attr('class', 'context')
    .attr('transform', 'translate(' + margin2.left + ',' + (margin2.top + 60) + ')');

  var legend = svg.append('g')
    .attr('class', 'chart__legend')
    .attr('width', width)
    .attr('height', 30)
    .attr('transform', 'translate(' + margin2.left + ', 10)');

  var rangeSelection =  legend
    .append('g')
    .attr('class', 'chart__range-selection')
    .attr('transform', 'translate(0, 0)');
    
  function show_data(all_data, legendData) {

    // Create a new array containing only the data where `visible` is true
    var visibleData = all_data.filter((item, index) => legendData[index].visible);
    var visibleLegend = legendData.filter((item, index) => legendData[index].visible);

    // Concatenate all the filtered data arrays into a single array
    let datas = visibleData.reduce((acc, val) => acc.concat(val), []);

    var brush = d3.svg.brush()
      .x(x_date_slider)
      .on('brush', brushed);
    
    // Taking the range of dates from the first dataset (all of the datasets have the same dates)
    var xRange = d3.extent(all_data[0].map(function(d) { return d.date; })); 

    x.domain(xRange);
    x_volume.domain(xRange);
    // Calculate extent
    let priceExtent = d3.extent(datas, function(d) { return d.price; });
    let priceExtent_from_zero = [0, priceExtent[1]];
    let volumeExtent = d3.extent(datas, function(d) { return d.volume; });
    let volumeExtent_from_zero = [0, volumeExtent[1]];
    // Set domain based on the merged data extent
    y.domain(priceExtent_from_zero);
    y_volume.domain(volumeExtent_from_zero);

    x_date_slider.domain(x.domain());
    y_date_slider.domain(y.domain());
    
    legend.selectAll('text').remove();
    var range = legend.append('text')
      .text(legendFormat(new Date(xRange[0])) + ' - ' + legendFormat(new Date(xRange[1])))
      .style('text-anchor', 'end')
      .attr('transform', 'translate(' + width + ', 0)');

    focus.append('g')
        .attr('class', 'y chart__grid')
        .call(make_y_axis()
        .tickSize(-width, 0, 0)
        .tickFormat(''));
         
    // Create chart paths dynamically based on visibleData
    var averageCharts = visibleData.map((dataItem, index) => {
      return focus.append('path')
          .datum(dataItem)
          .attr('class', 'chart__line chart__average--focus line')
          .attr('d', avgLine);
    });

    var priceCharts = visibleData.map((dataItem, index) => {
      return focus.append('path')
          .datum(dataItem)
          .attr('class', 'chart__line chart__price--focus line')
          .attr('d', priceLine)
          .style("stroke", visibleLegend[index].color); // Apply color from visibleColors array
    });

    focus.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0 ,' + height + ')')
        .call(x_axis);

    focus.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(12, 0)')
        .call(y_axis);

        // Filter and map the data to include only visible datasets
    var stackData = all_data
      .map((dataset, index) => {
          return {
              name: legendData[index].name,
              values: dataset.map(d => ({x: d.date, y: d.volume}))
          };
      })
      .filter((_, index) => legendData[index].visible);

    var stack = d3.layout.stack()
      // .offset("wiggle")
      .values(function(d) { return d.values; });

    barsGroup.selectAll('g')
      .data(stack(stackData))
      .enter().append('g')
      .style('fill', function(d, i) { return visibleLegend[i].color; }) // Use the colors array defined earlier
      .selectAll('rect')
        .data(function(d) { return d.values; })
        .enter().append('rect')
        .attr('x', function(d) { return x(d.x); })
        .attr('y', function(d) {
            var yPos = y_volume(d.y0 + d.y);  // Calculate the y position
            return isNaN(yPos) ? 0 : yPos;     // Check if yPos is NaN, if so return 0, else return yPos
        })
        .attr('height', function(d) { var y_h = y_volume(d.y0) - y_volume(d.y0 + d.y);
          return isNaN(y_h) ? 0 : y_h;  }) // Adjust height for stacked bars
        .attr('width', 1); // Maintain the width as 1

    var helper = focus.append('g')
      .attr('class', 'chart__helper')
      .style('text-anchor', 'start')
      .attr('transform', 'translate(' + 0 + ', ' + - 20 + ')');

    var helperText = helper.append('text')

    var priceTooltip = focus.append('g')
      .attr('class', 'chart__tooltip--price')
      .append('circle')
      .style('display', 'none')
      .attr('r', 4);

    var averageTooltip = focus.append('g')
      .attr('class', 'chart__tooltip--average')
      .append('circle')
      .style('display', 'none')
      .attr('r', 4);

    svg.append('g')
      .attr('class', 'chart__mouse')
      .append('rect')
      .attr('class', 'chart__overlay')
      .attr('width', width)
      .attr('height', height)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .on('mouseover', function() {
        helper.style('display', null);
        priceTooltip.style('display', null);
        averageTooltip.style('display', null);
      })
      .on('mouseout', function() {
        helper.style('display', 'none');
        priceTooltip.style('display', 'none');
        averageTooltip.style('display', 'none');
      })
      .on('mousemove', mousemove);

    context.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (height_date_slider) + ')')
        .call(x_date_slider_axis);

    context.append('g')
        .attr('class', 'x brush')
        .call(brush)
      .selectAll('rect')
        .attr('y', -6)
        .attr('height', height_date_slider + 7);

    // Load and parse the data (you will replace this with AJAX or a similar method to fetch your data)
    d3.csv('./data/HISTORYEVENTS.csv', function(error, data) {
    if (error) throw error;

      data.forEach(function(d) {
          d.Date = parseDate(d.Date);
          
      });
      var tooltip = d3.select("#tooltip");
      // Add the events as circles
      context.selectAll(".event")
          .data(data)
        .enter().append("circle")
          .attr("class", "event")
          .attr("cx", function(d) { return x_date_slider(d.Date); })
          .attr("cy", height_date_slider)  // Adjust the vertical position as needed
          .attr("r", 5)
          .style("fill", "blue")  // Set the fill color; adjust as needed
          .style("fill-opacity", 0.5)  // Set fill opacity to 50% for transparency
          .style("stroke", "black")  // Color of the stroke
          .style("stroke-width", "1px")  // Tiny stroke width
          .on("mouseover", function(d) {
            // Update tooltip content and make it visible
            tooltip.html(
              "<strong>Date:</strong> <em>" + d3.time.format("%B %d, %Y")(d.Date) + "</em><br>" +
              "<strong>Event:</strong> " + d.Event + "<br>" +
              "<strong>Description:</strong> " + d.Description
            )
            .style("font-family", "Arial, sans-serif")
            .style("visibility", "visible")
            .style("top", (height + margin.top + margin.bottom + 100) + "px");  // Positioning below the graph
                })
            .on("mouseout", function(d) {
              // Hide the tooltip
              tooltip.style("visibility", "hidden");
            })  
    });

    var closenessThreshold = 20; // pixels, adjust based on your needs
    function mousemove() {
      var mouse = d3.mouse(this); // Gets the x and y coordinates of the mouse
      var x_mouse_location = mouse[0]; // Adjust mouse position by margin
      var y_mouse_location = mouse[1];
      var x_data_value = x.invert(x_mouse_location); // convert back from pixel to data value  

      function findClosestAndCalculateDistance(data, x_data_value, y_mouse_location, y) {
        var bisectDate = d3.bisector(function(d) { return d.date; }).left;
        var i = bisectDate(data, x_data_value, 1);
        var d0 = data[i - 1];
        var d1 = data[i];
        var closestData = x_data_value - d0.date > d1.date - x_data_value ? d1 : d0;
        var lineY = y(closestData.price);
        var distance = Math.abs(y_mouse_location - lineY);
        return {distance, closestData};
      }

      // Assuming you have defined `y` as a D3 scale, and `y_mouse_location` and `x_data_value` are known
      var distance_closestData_values = visibleData.map(dataset => findClosestAndCalculateDistance(dataset, x_data_value, y_mouse_location, y));
      // Create an array of all 'distance' values
      var distance_values = distance_closestData_values.map(function(item) {
        return item.distance;
      });

      // Create an array of all 'closestData' values
      var closestData_values = distance_closestData_values.map(function(item) {
        return item.closestData;
      });

      var minimumValue = Math.min.apply(Math, distance_values);
      var minimumIndex = distance_values.indexOf(minimumValue);

      d_final = closestData_values[minimumIndex]
      if (minimumValue <= closenessThreshold) {
        helperText.text(legendFormat(new Date(d_final.date)) +
        ' | Price: ' + d_final.price.toLocaleString() + 
        ' | Moving Average: ' + d_final.average.toLocaleString() +
        ' | Volume: ' + d_final.volume.toLocaleString());

        priceTooltip.attr('transform', 'translate(' + x(d_final.date) + ',' + y(d_final.price) + ')');
        averageTooltip.attr('transform', 'translate(' + x(d_final.date) + ',' + y(d_final.average) + ')');
      }
    }
  
    function brushed() {
      var ext = brush.extent();
      if (!brush.empty()) {
        x.domain(brush.empty() ? x_date_slider.domain() : brush.extent());
        
        // Calculate the difference in milliseconds
        var differenceInMillis = ext[1] - ext[0];

        // Convert milliseconds to days
        var differenceInDays = differenceInMillis / (1000 * 60 * 60 * 24);

        // Calculate the upper bound of the difference in days
        var upperBoundDays = Math.ceil(differenceInDays);

        var customWidth = Math.floor(width / upperBoundDays);
    
        // Calculate global min and max across all datasets
        var minPrice = d3.min(visibleData, function(ds) {
          return d3.min(ds, function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d.price : Infinity; });
        });
        var maxPrice = d3.max(visibleData, function(ds) {
          return d3.max(ds, function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d.price : -Infinity; });
        });
    
        y.domain([minPrice, maxPrice]);
    
        // Update text and positions
        range.text(legendFormat(new Date(ext[0])) + ' - ' + legendFormat(new Date(ext[1])));
        // Update the bars in the focusGraph
        var stackData = all_data
        .map((dataset, index) => {
            return {
                name: legendData[index].name,
                values: dataset.map(d => ({x: d.date, y: d.volume}))
            };
        })
        .filter((_, index) => legendData[index].visible);

        var stackedData = stack(stackData);  // Recalculate stack layout

        var bars = barsGroup.selectAll('g').data(stackedData);  // Rebind updated data
        bars.enter().append('g')
            .style('fill', function(d, i) { return visibleColors[i]; });
        bars.exit().remove();

        var rects = bars.selectAll('rect')
            .data(function(d) { return d.values; });

        rects.enter().append('rect');
        rects.exit().remove();

        rects.attr('x', function(d) { return x(d.x); })
        .attr('y', function(d) {
          var yPos = y_volume(d.y0 + d.y);  // Calculate the y position
          return isNaN(yPos) ? 0 : yPos;     // Check if yPos is NaN, if so return 0, else return yPos
      })
        .attr('height', function(d) { var y_h = y_volume(d.y0) - y_volume(d.y0 + d.y);
          return isNaN(y_h) ? 0 : y_h;  }) // Adjust height for stacked bars
            .attr('width', customWidth < 1 ? 1 : customWidth);  // Mark - Updated attributes for rects
                      // Additional adjustments for focusGraph, etc.
      }
    
      // Assuming avgLine and priceLine are updated elsewhere or need dynamic computation here
      averageCharts.forEach(chart => {
        chart.attr('d', avgLine); // Ensure avgLine is correctly updated for the new x domain
      });
      priceCharts.forEach(chart => {
        chart.attr('d', priceLine); // Ensure priceLine is correctly updated for the new x domain
      });
    
      focus.select('.x.axis').call(x_axis);
      focus.select('.y.axis').call(y_axis);
    }
    var dateRange = ['1w', '1m', '3m', '6m', '1y', '3y', '7y']
    for (var i = 0, l = dateRange.length; i < l; i ++) {
      var v = dateRange[i];
      rangeSelection
        .append('text')
        .attr('class', 'chart__range-selection')
        .text(v)
        .attr('transform', 'translate(' + (18 * i) + ', 0)')
        .on('click', function() { focusOnRange(this.textContent); });
    }

    function focusOnRange(range) {
      var today = new Date(all_data[0][all_data[0].length - 1].date)
      var ext = new Date(all_data[0][all_data[0].length - 1].date)

      if (range === '1m')
        ext.setMonth(ext.getMonth() - 1)

      if (range === '1w')
        ext.setDate(ext.getDate() - 7)

      if (range === '3m')
        ext.setMonth(ext.getMonth() - 3)

      if (range === '6m')
        ext.setMonth(ext.getMonth() - 6)

      if (range === '3y')
        ext.setFullYear(ext.getFullYear() - 3)

      if (range === '7y')
        ext.setFullYear(ext.getFullYear() - 7)

      brush.extent([ext, today])
      brushed()
      context.select('g.x.brush').call(brush.extent([ext, today]))
    }
  }  
  var filePaths = ['./data/STOCKHISTORY_SPY.csv', './data/STOCKHISTORY_QQQ.csv', './data/STOCKHISTORY_ACWI.csv', './data/STOCKHISTORY_SOXX.csv'];
    d3.csv(filePaths[0], type, function(err, data) {
      d3.csv(filePaths[1], type, function(err, data2) {
        d3.csv(filePaths[2], type, function(err, data3) {
          d3.csv(filePaths[3], type, function(err, data4) {
            var all_data = [data, data2, data3, data4]
            var legendData = [
              {name: "SPY", color: "#1f77b4", visible: true},
              {name: "QQQ", color: "#ff7f0e", visible: true},
              {name: "ACWI", color: "#2ca02c", visible: true},
              {name: "SOXX", color: "#d62728", visible: true}
            ];
            show_data(all_data, legendData)
          
            var legend = svg.append("g")
              .attr("class", "legend")
              .attr("transform", "translate(" + (0) + ", 30)"); // Adjust these values to position your legend
            legend.selectAll("legendItem")
              .data(legendData)
              .enter().append("g")
              .attr("class", "legendItem")
              .attr("transform", function(d, i) { return "translate(0," + i * 40 + ")"; }) // Space items vertically
              .each(function(d, i) {
                // For each legend item, append a colored rectangle
                d3.select(this).append("rect")
                  .attr("width", 20)
                  .attr("height", 20)
                  .attr("stroke", "black")
                  .attr("fill", d.color)
                  .on("click", function() {
                    // Toggle visibility
                    d.visible = !d.visible;
                    d3.select(this).attr("fill", d.visible ? d.color : "white");
                    initializeCharts();
                    show_data(all_data, legendData)
                  });
              
                // Append text label for the colored rectangle
                d3.select(this).append("text")
                  .attr("x", 30) // Position text to the right of the rectangle
                  .attr("y", 10) // Align text vertically
                  .attr("dy", ".35em") // Center text vertically in the rectangle
                  .text(d.name);
              });
          })
        })
      })
    });// end Data

  function initializeCharts() {
    barsGroup.selectAll("*").remove();
    focus.selectAll("*").remove();
    context.selectAll("*").remove();

    priceLine = d3.svg.line()
      .interpolate('monotone')
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.price); });

    avgLine = d3.svg.line()
      .interpolate('monotone')
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.average); });
  }

  function type(d) {
    // Remove commas and other non-numeric characters except decimal point
    var cleanVolume = d.Volume.replace(/,/g, ''); // Removes commas
    var cleanPrice = d.Close.replace(/[^\d.]/g, ''); // Removes everything except digits and decimal point
  
    return {
      date: parseDate(d.Date),
      price: +cleanPrice, // Convert cleaned price string to number
      average: +d.Average, // Assuming 'Average' is already in a correct numeric format
      volume: +cleanVolume, // Convert cleaned volume string to number
    };
  }
}());
