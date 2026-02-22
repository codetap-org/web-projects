document.addEventListener("DOMContentLoaded", (event) => {
    
    //Background Gradients
    const g1 = "linear-gradient(0deg,rgba(58, 54, 168, 1) 0%, rgba(132, 0, 255, 1) 100%)";

    const g2 = "linear-gradient(360deg,rgba(58, 54, 168, 1) 0%, rgba(61, 28, 250, 1) 100%)";

    //Background Animation
    gsap.fromTo(".mainContainer", 
            {
                background: g1, 
            },
            {
                ease: "none", 
                duration: 16, 
                background: g2, 
                repeat: -1,
                yoyo: true
            }
           )
    
    gsap.to("#light", {
      ease: "none",
      duration: 10,
      rotation: 360,
      repeat: -1,
    })
    
    gsap.to("#lightA", {
      ease: "none",
      duration: 12,
      rotation: -360,
      repeat: -1,
    })

    const svgControlContainer = document.querySelector(".svgContainer")
    const innerCircle = document.querySelectorAll("circle")

    svgControlContainer.addEventListener("pointermove", (e) => {
      console.log(e.offsetX)
      gsap.to(innerCircle, {
        x: e.offsetX - svgControlContainer.clientWidth/2,
        y: e.offsetY - svgControlContainer.clientHeight/2,
        stagger: 0.02,
      })
    })

    
    
  })