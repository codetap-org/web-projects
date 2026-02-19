import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

//Background Gradients
const g1 = "linear-gradient(0deg,rgba(58, 54, 168, 1) 0%, rgba(132, 0, 255, 1) 100%)";

const g2 = "linear-gradient(360deg,rgba(58, 54, 168, 1) 0%, rgba(132, 0, 255, 1) 100%)";

//Background Animation
gsap.fromTo(".mainContainer", 
        {
            background: g1, 
        },
        {
            ease: "none", 
            duration: 10, 
            background: g2, 
            repeat: -1, 
        }
       )


//D3 Code
const count = 20
const maxRadius = 500

// Generates [0, 1, 2, 3... 9]
const data = d3.range(count).reverse()
console.log(data)

const radiusScale = d3.scaleRadial()
  .domain([0, count - 1])
  .range([10, maxRadius]); // Starts at 10px, ends at 150px

// 3. Create the SVG container
const width = 1000;
const height = 1000;
const center = { x: width / 2, y: height / 2 };

const svg = d3.select(".d3container")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// 2. Create a sequential color scale
const colorScale = d3.scaleSequential()
  .domain([0, d3.max(data)]) // Map the radius value to the color range
  .interpolator(d3.interpolateMagma);

// 4. Draw the circles
svg.selectAll("circle")
  .data(data)
  .enter()
  .append("circle")
    .attr("cx", center.x)
    .attr("cy", center.y)
    .attr("r", d => radiusScale(d)) // 'd' is the value from our radii array
    .style("fill", d => colorScale(d))
    .style("stroke", "fff")
     .attr("stroke-opacity", 0.5)
    .style("stroke-width", 2);