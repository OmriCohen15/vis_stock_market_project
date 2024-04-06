/* global d3, _ */

(function() {

var margin = {top: 30, right: 20, bottom: 100, left: 75},
  margin2  = {top: 210, right: 20, bottom: 20, left: 75};

var width    =  window.innerWidth - margin.left - margin.right - 20, // -20 for the margin
    height   = 283 - margin.top - margin.bottom,
    height_date_slider  = 283 - margin2.top - margin2.bottom;

  var parseDate = d3.time.format('%d/%m/%Y').parse,
      bisectDate = d3.bisector(function(d) { return d.date; }).left,
      legendFormat = d3.time.format('%b %d, %Y');

  var x = d3.time.scale().range([0, width]),
      y = d3.scale.linear().range([height, 0]),
      x_volume  = d3.time.scale().range([0, width]),
      y_volume  = d3.scale.linear().range([height, height-50]),
      x_date_slider  = d3.time.scale().range([0, width]),
      y_date_slider  = d3.scale.linear().range([height_date_slider, 0]);

  var x_axis   = d3.svg.axis().scale(x).orient('bottom'),
      y_axis   = d3.svg.axis().scale(y).orient('left'),
      x_axis_volume   = d3.svg.axis().scale(x_volume).orient('bottom'),
      y_axis_volume   = d3.svg.axis().scale(y_volume).orient('left'),
      x_date_slider_axis  = d3.svg.axis().scale(x_date_slider).orient('bottom');

  var priceLine = d3.svg.line()
    .interpolate('monotone')
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.price); });

  var avgLine = d3.svg.line()
    .interpolate('monotone')
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.average); });
  
  var area_date_slider = d3.svg.area()
    .interpolate('monotone')
    .x(function(d) { return x_date_slider(d.date); })
    .y0(height_date_slider)
    .y1(function(d) { return y_date_slider(d.price); });

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

  var legendData = [
    {name: "SPY", color: "#1f77b4", visible: true},
    {name: "QQQ", color: "#ff7f0e", visible: true},
    {name: "ACWI", color: "#2ca02c", visible: true},
    {name: "SOXX", color: "#d62728", visible: true}
  ];

  var legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", "translate(" + (0) + ", 30)"); // Adjust these values to position your legend

  legend.selectAll("legendItem")
  .data(legendData)
  .enter().append("g")
    .attr("class", "legendItem")
    .attr("transform", function(d, i) { return "translate(0," + i * 25 + ")"; }) // Space items vertically
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
        });
      
      // Append text label for the colored rectangle
      d3.select(this).append("text")
        .attr("x", 30) // Position text to the right of the rectangle
        .attr("y", 10) // Align text vertically
        .attr("dy", ".35em") // Center text vertically in the rectangle
        .text(d.name);
    });

  var legend = svg.append('g')
    .attr('class', 'chart__legend')
    .attr('width', width)
    .attr('height', 30)
    .attr('transform', 'translate(' + margin2.left + ', 10)');

        var rangeSelection =  legend
    .append('g')
    .attr('class', 'chart__range-selection')
    .attr('transform', 'translate(0, 0)');
    
                  // Blue , Orange, Green, Red
  var colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];
  var filePaths = ['./data/STOCKHISTORY_SPY.csv', './data/STOCKHISTORY_QQQ.csv', './data/STOCKHISTORY_ACWI.csv', './data/STOCKHISTORY_SOXX.csv'];
    d3.csv(filePaths[0], type, function(err, data) {
      d3.csv(filePaths[1], type, function(err, data2) {
        d3.csv(filePaths[2], type, function(err, data3) {
          d3.csv(filePaths[3], type, function(err, data4) {
              let datas = data.concat(data2, data3, data4); // Merge data arrays

              var brush = d3.svg.brush()
                .x(x_date_slider)
                .on('brush', brushed);
          
              //console.log(data2);
              var xRange = d3.extent(data.map(function(d) { return d.date; }));
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
          
              //var min = d3.min(datas.map(function(d) { return d.price; }));
              var min = 0;
              var max = d3.max(datas.map(function(d) { return d.price; }));
          
              var range = legend.append('text')
                .text(legendFormat(new Date(xRange[0])) + ' - ' + legendFormat(new Date(xRange[1])))
                .style('text-anchor', 'end')
                .attr('transform', 'translate(' + width + ', 0)');
          
              focus.append('g')
                  .attr('class', 'y chart__grid')
                  .call(make_y_axis()
                  .tickSize(-width, 0, 0)
                  .tickFormat(''));

              var averageChart = focus.append('path')
                  .datum(data)
                  .attr('class', 'chart__line chart__average--focus line')
                  .attr('d', avgLine);
              var averageChart2 = focus.append('path')
                  .datum(data2)
                  .attr('class', 'chart__line chart__average--focus line')
                  .attr('d', avgLine);
              var averageChart3 = focus.append('path')
                  .datum(data3)
                  .attr('class', 'chart__line chart__average--focus line')
                  .attr('d', avgLine);                  
              var averageChart4 = focus.append('path')
                  .datum(data4)
                  .attr('class', 'chart__line chart__average--focus line')
                  .attr('d', avgLine);                  

              var priceChart = focus.append('path')
                  .datum(data)
                  .attr('class', 'chart__line chart__price--focus line')
                  .attr('d', priceLine)
                  .style("stroke", colors[0]); // Set the line color to blue
              var priceChart2 = focus.append('path')
                  .datum(data2)
                  .attr('class', 'chart__line chart__price--focus line')
                  .attr('d', priceLine)
                  .style("stroke", colors[1]); // Set the line color to blue
              var priceChart3 = focus.append('path')
                  .datum(data3)
                  .attr('class', 'chart__line chart__price--focus line')
                  .attr('d', priceLine)
                  .style("stroke", colors[2]); // Set the line color to blue
              var priceChart4 = focus.append('path')
                  .datum(data4)
                  .attr('class', 'chart__line chart__price--focus line')
                  .attr('d', priceLine)
                  .style("stroke", colors[3]); // Set the line color to blue                                                      
          
              focus.append('g')
                  .attr('class', 'x axis')
                  .attr('transform', 'translate(0 ,' + height + ')')
                  .call(x_axis);
          
              focus.append('g')
                  .attr('class', 'y axis')
                  .attr('transform', 'translate(12, 0)')
                  .call(y_axis);

              var stack = d3.layout.stack()
                // .offset("wiggle")
                .values(function(d) { return d.values; });
              // TODO: Make the stacked bars width to be wider and bigger when zooming in (with brush)
              var focusGraph = barsGroup.selectAll('g')
                               .data(stack([
                                {name: "SPY", values: data.map(function(d) { return {x: d.date, y: d.volume}; })},
                                {name: "QQQ", values: data2.map(function(d) { return {x: d.date, y: d.volume}; })},
                                {name: "ACWI", values: data3.map(function(d) { return {x: d.date, y: d.volume}; })},
                                {name: "SOXX", values: data4.map(function(d) { return {x: d.date, y: d.volume}; })}
                              ]))
                  .enter().append('g')
                  .style('fill', function(d, i) { return colors[i]; }) // Use the colors array defined earlier
                  .selectAll('rect')
                  .data(function(d) { return d.values; })
                  .enter().append('rect')
                    .attr('x', function(d) { return x(d.x); })
                    .attr('y', function(d) {
                      //TODO: check why receive NaN on count 7044 in y and height
                      var yPos = y_volume(d.y0 + d.y);  // Calculate the y position
                      return isNaN(yPos) ? 0 : yPos;     // Check if yPos is NaN, if so return 0, else return yPos
                  })
                    // .attr('y', function(d) { return y_volume((d.y0 + d.y)); }) // Use y0 + y for stacked bar position
                    .attr('height', function(d) { var y_h = y_volume(d.y0) - y_volume(d.y0 + d.y);
                      return isNaN(y_h) ? 0 : y_h;  }) // Adjust height for stacked bars
                    .attr('width', 1); // Maintain the width as 1

              var helper = focus.append('g')
                .attr('class', 'chart__helper')
                .style('text-anchor', 'end')
                .attr('transform', 'translate(' + width + ', 0)');
          
              var helperText = helper.append('text')
          
              var priceTooltip = focus.append('g')
                .attr('class', 'chart__tooltip--price')
                .append('circle')
                .style('display', 'none')
                .attr('r', 2.5);
          
              var averageTooltip = focus.append('g')
                .attr('class', 'chart__tooltip--average')
                .append('circle')
                .style('display', 'none')
                .attr('r', 2.5);

              var mouseArea = svg.append('g')
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
          
              //TODO: chnage to history events
              context.append('path')
                  .datum(data)
                  .attr('class', 'chart__area area')
                  .attr('d', area_date_slider);
          
              context.append('g')
                  .attr('class', 'x axis chart__axis--context')
                  .attr('y', 0)
                  .attr('transform', 'translate(0,' + (height_date_slider - 22) + ')')
                  .call(x_date_slider_axis);
          
              context.append('g')
                  .attr('class', 'x brush')
                  .call(brush)
                .selectAll('rect')
                  .attr('y', -6)
                  .attr('height', height_date_slider + 7);

              var closenessThreshold = 20; // pixels, adjust based on your needs
              function mousemove() {
                var mouse = d3.mouse(this); // Gets the x and y coordinates of the mouse
                var x_mouse_location = mouse[0]; // Adjust mouse position by margin
                var y_mouse_location = mouse[1];
                var x_data_value = x.invert(x_mouse_location); // convert back from pixel to data value  

                var i = bisectDate(data, x_data_value, 1);
                var d0 = data[i - 1];
                var d1 = data[i];
                var d = x_data_value - d0.date > d1.date - x_data_value ? d1 : d0;
                  // Calculate the distance from the mouse to the closest point on the line                
                var lineY = y(d.price); // y position of the closest data point on the line
                var distance = Math.abs(y_mouse_location - lineY); // Include margin.top if your y position is relative to the SVG container

                var i_2 = bisectDate(data2, x_data_value, 1);
                var d0_2 = data2[i_2 - 1];
                var d1_2 = data2[i_2];
                var d_2 = x_data_value - d0_2.date > d1_2.date - x_data_value ? d1_2 : d0_2;
                  // Calculate the distance from the mouse to the closest point on the line                
                var lineY_2 = y(d_2.price); // y position of the closest data point on the line
                var distance_2 = Math.abs(y_mouse_location - lineY_2); // Include margin.top if your y position is relative to the SVG container

                var i_3 = bisectDate(data3, x_data_value, 1);
                var d0_3 = data3[i_3 - 1];
                var d1_3 = data3[i_3];
                var d_3 = x_data_value - d0_3.date > d1_3.date - x_data_value ? d1_3 : d0_3;
                  // Calculate the distance from the mouse to the closest point on the line                
                var lineY_3 = y(d_3.price); // y position of the closest data point on the line
                var distance_3 = Math.abs(y_mouse_location - lineY_3); // Include margin.top if your y position is relative to the SVG container

                var i_4 = bisectDate(data4, x_data_value, 1);
                var d0_4 = data4[i_4 - 1];
                var d1_4 = data4[i_4];
                var d_4 = x_data_value - d0_4.date > d1_4.date - x_data_value ? d1_4 : d0_4;
                  // Calculate the distance from the mouse to the closest point on the line                
                var lineY_4 = y(d_4.price); // y position of the closest data point on the line
                var distance_4 = Math.abs(y_mouse_location - lineY_4); // Include margin.top if your y position is relative to the SVG container

                var values = [distance, distance_2, distance_3, distance_4];
                var minimumValue = Math.min.apply(Math, values);
                var minimumIndex = values.indexOf(minimumValue) + 1;
                
                // Perform an action based on which variable is the minimum
                switch (minimumIndex) {
                  case 1:
                    d_final = d;
                      // Add action specific to when value1 is the minimum
                      break;
                  case 2:
                    d_final = d_2;
                      // Add action specific to when value2 is the minimum
                      break;
                  case 3:
                    d_final = d_3;
                      // Add action specific to when value3 is the minimum
                      break;
                  case 4:
                    d_final = d_4;
                      // Add action specific to when value4 is the minimum
                      break;
                  default:
                      console.log("Unexpected case");
                      // Handle unexpected case
                }

                if (minimumValue <= closenessThreshold) {
                  helperText.text(legendFormat(new Date(d_final.date)) + ' - Price: ' + d_final.price + ' Avg: ' + d_final.average + ' Vol: ' + d_final.volume);
                  priceTooltip.attr('transform', 'translate(' + x(d_final.date) + ',' + y(d_final.price) + ')');
                  averageTooltip.attr('transform', 'translate(' + x(d_final.date) + ',' + y(d_final.average) + ')');
                }
              }
            
              function brushed() {
                var ext = brush.extent();
                if (!brush.empty()) {
                  x.domain(brush.empty() ? x_date_slider.domain() : brush.extent());
              
                  // Calculate global min and max across all datasets
                  var allData = [data, data2, data3, data4];
                  var minPrice = d3.min(allData, function(ds) {
                    return d3.min(ds, function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d.price : Infinity; });
                  });
                  var maxPrice = d3.max(allData, function(ds) {
                    return d3.max(ds, function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d.price : -Infinity; });
                  });
              
                  y.domain([minPrice, maxPrice]);
              
                  // Update text and positions
                  range.text(legendFormat(new Date(ext[0])) + ' - ' + legendFormat(new Date(ext[1])));
                  // Update the bars in the focusGraph
                  var stackData = [
                    {name: "SPY", values: data.map(function(d) { return {x: d.date, y: d.volume}; })},
                    {name: "QQQ", values: data2.map(function(d) { return {x: d.date, y: d.volume}; })},
                    {name: "ACWI", values: data3.map(function(d) { return {x: d.date, y: d.volume}; })},
                    {name: "SOXX", values: data4.map(function(d) { return {x: d.date, y: d.volume}; })}
                  ];
                  var stackedData = stack(stackData);  // Recalculate stack layout

                  var bars = barsGroup.selectAll('g').data(stackedData);  // Rebind updated data
                  bars.enter().append('g')
                      .style('fill', function(d, i) { return colors[i]; });
                  bars.exit().remove();

                  var rects = bars.selectAll('rect')
                      .data(function(d) { return d.values; });

                  rects.enter().append('rect');
                  rects.exit().remove();

                  rects.attr('x', function(d) { return x(d.x); })
                  .attr('y', function(d) {
                    //TODO: check why receive NaN on count 7044 in y and height
                    var yPos = y_volume(d.y0 + d.y);  // Calculate the y position
                    return isNaN(yPos) ? 0 : yPos;     // Check if yPos is NaN, if so return 0, else return yPos
                })
                  // .attr('y', function(d) { return y_volume((d.y0 + d.y)); }) // Use y0 + y for stacked bar position
                  .attr('height', function(d) { var y_h = y_volume(d.y0) - y_volume(d.y0 + d.y);
                    return isNaN(y_h) ? 0 : y_h;  }) // Adjust height for stacked bars
                      .attr('width', 1);  // Mark - Updated attributes for rects
                                // Additional adjustments for focusGraph, etc.
                }
              
                // Update charts
                let averageCharts = [averageChart, averageChart2, averageChart3, averageChart4];
                let priceCharts = [priceChart, priceChart2, priceChart3, priceChart4];
              
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
              var dateRange = ['1w', '1m', '3m', '6m', '1y', '5y']
              for (var i = 0, l = dateRange.length; i < l; i ++) {
                var v = dateRange[i];
                rangeSelection
                  .append('text')
                  .attr('class', 'chart__range-selection')
                  .text(v)
                  .attr('transform', 'translate(' + (18 * i) + ', 0)')
                  .on('click', function(d) { focusOnRange(this.textContent); });
              }
          
              function focusOnRange(range) {
                var today = new Date(data[data.length - 1].date)
                var ext = new Date(data[data.length - 1].date)
          
                if (range === '1m')
                  ext.setMonth(ext.getMonth() - 1)
          
                if (range === '1w')
                  ext.setDate(ext.getDate() - 7)
          
                if (range === '3m')
                  ext.setMonth(ext.getMonth() - 3)
          
                if (range === '6m')
                  ext.setMonth(ext.getMonth() - 6)
          
                if (range === '1y')
                  ext.setFullYear(ext.getFullYear() - 1)
          
                if (range === '5y')
                  ext.setFullYear(ext.getFullYear() - 5)
          
                brush.extent([ext, today])
                brushed()
                context.select('g.x.brush').call(brush.extent([ext, today]))
              }
          })
        })
      })
    });// end Data

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