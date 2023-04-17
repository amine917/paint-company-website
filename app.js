const displacementSlider = function(opts) {

    let vertex = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `;

    let fragment = `
        
        varying vec2 vUv;

        uniform sampler2D currentImage;
        uniform sampler2D nextImage;

        uniform float dispFactor;

        void main() {

            vec2 uv = vUv;
            vec4 _currentImage;
            vec4 _nextImage;
            float intensity = 0.3;

            vec4 orig1 = texture2D(currentImage, uv);
            vec4 orig2 = texture2D(nextImage, uv);
            
            _currentImage = texture2D(currentImage, vec2(uv.x, uv.y + dispFactor * (orig2 * intensity)));

            _nextImage = texture2D(nextImage, vec2(uv.x, uv.y + (1.0 - dispFactor) * (orig1 * intensity)));

            vec4 finalTexture = mix(_currentImage, _nextImage, dispFactor);

            gl_FragColor = finalTexture;

        }
    `;

    let images = opts.images, image, sliderImages = [];;
    let canvasWidth = images[0].clientWidth;
    let canvasHeight = images[0].clientHeight;
    let parent = opts.parent;
    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    let renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    let renderW, renderH;

    if( renderWidth > canvasWidth ) {
        renderW = renderWidth;
    } else {
        renderW = canvasWidth;
    }

    renderH = canvasHeight;

    let renderer = new THREE.WebGLRenderer({
        antialias: false,
    });

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0x23272A, 1.0 );
    renderer.setSize( renderW, renderH );
    parent.appendChild( renderer.domElement );

    let loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
 // console.log(images);
    images.forEach( ( img ) => {
        style = img.currentStyle || window.getComputedStyle(img, false),
       // console.log(style.backgroundImage.slice(4, -1).replace(/"/g, ""));
        image = loader.load(style.backgroundImage.slice(4, -1).replace(/"/g, "") + '?v=' + Date.now() );
        image.magFilter = image.minFilter = THREE.LinearFilter;
        image.anisotropy = renderer.capabilities.getMaxAnisotropy();
        sliderImages.push( image );

    });

    let scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x23272A );
    let camera = new THREE.OrthographicCamera(
        renderWidth / -2,
        renderWidth / 2,
        renderHeight / 2,
        renderHeight / -2,
        1,
        1000
    );

    camera.position.z = 1;

    let mat = new THREE.ShaderMaterial({
        uniforms: {
            dispFactor: { type: "f", value: 0.0 },
            currentImage: { type: "t", value: sliderImages[0] },
            nextImage: { type: "t", value: sliderImages[1] },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        opacity: 1.0
    });

    let geometry = new THREE.PlaneBufferGeometry(
        parent.offsetWidth,
        parent.offsetHeight,
        1
    );
    let object = new THREE.Mesh(geometry, mat);
    object.position.set(0, 0, 0);
    scene.add(object);

    let addEvents = function(){

        let pagButtons = Array.from(document.getElementById('pagination').querySelectorAll('button'));
        let isAnimating = false;

        pagButtons.forEach( (el) => {

            el.addEventListener('click', function() {

                if( !isAnimating ) {

                    isAnimating = true;

                    document.getElementById('pagination').querySelectorAll('.active')[0].className = '';
                    this.className = 'active';

                    let slideId = parseInt( this.dataset.slide, 10 );

                    mat.uniforms.nextImage.value = sliderImages[slideId];
                    mat.uniforms.nextImage.needsUpdate = true;

                    TweenLite.to( mat.uniforms.dispFactor, 1, {
                        value: 1,
                        ease: 'Expo.easeInOut',
                        onComplete: function () {
                            mat.uniforms.currentImage.value = sliderImages[slideId];
                            mat.uniforms.currentImage.needsUpdate = true;
                            mat.uniforms.dispFactor.value = 0.0;
                            isAnimating = false;
                        }
                    });

                    let slideTitleEl = document.getElementById('slide-title');
                   // let slideStatusEl = document.getElementById('slide-status');
                    let nextSlideTitle = document.querySelectorAll(`[data-slide-title="${slideId}"]`)[0].innerHTML;
                //    let nextSlideStatus = document.querySelectorAll(`[data-slide-status="${slideId}"]`)[0].innerHTML;

                    TweenLite.fromTo( slideTitleEl, 0.5,
                        {
                            autoAlpha: 1,
                            y: 0
                        },
                        {
                            autoAlpha: 0,
                            y: 20,
                            ease: 'Expo.easeIn',
                            onComplete: function () {
                                slideTitleEl.innerHTML = nextSlideTitle;

                                TweenLite.to( slideTitleEl, 0.5, {
                                    autoAlpha: 1,
                                    y: 0,
                                })
                            }
                        });

                /*    TweenLite.fromTo( slideStatusEl, 0.5,
                        {
                            autoAlpha: 1,
                            y: 0
                        },
                        {
                            autoAlpha: 0,
                            y: 20,
                            ease: 'Expo.easeIn',
                            onComplete: function () {
                                slideStatusEl.innerHTML = nextSlideStatus;

                                TweenLite.to( slideStatusEl, 0.5, {
                                    autoAlpha: 1,
                                    y: 0,
                                    delay: 0.1,
                                })
                            }
                        });*/

                }

            });

        });

 setInterval(()=> {
               if( !isAnimating ) {
          
                   var k = parseInt(document.querySelector("button.active").dataset.slide)
                    k == images.length-1 ? k= 0: k= k+1;
                    isAnimating = true;
                    document.getElementById('pagination').querySelectorAll('.active')[0].className = '';
                    document.querySelector(`[data-slide="${k}"]`).className = 'active';

                    let slideId = parseInt( k, 10 );

                    mat.uniforms.nextImage.value = sliderImages[slideId];
                    mat.uniforms.nextImage.needsUpdate = true;

                    TweenLite.to( mat.uniforms.dispFactor, 1, {
                        value: 1,
                        ease: 'Expo.easeInOut',
                        onComplete: function () {
                            mat.uniforms.currentImage.value = sliderImages[slideId];
                            mat.uniforms.currentImage.needsUpdate = true;
                            mat.uniforms.dispFactor.value = 0.0;
                            isAnimating = false;
                        }
                    });

                    let slideTitleEl = document.getElementById('slide-title');
                //    let slideStatusEl = document.getElementById('slide-status');
                    let nextSlideTitle = document.querySelectorAll(`[data-slide-title="${slideId}"]`)[0].innerHTML;
                //    let nextSlideStatus = document.querySelectorAll(`[data-slide-status="${slideId}"]`)[0].innerHTML;

                    TweenLite.fromTo( slideTitleEl, 0.5,
                        {
                            autoAlpha: 1,
                            y: 0
                        },
                        {
                            autoAlpha: 0,
                            y: 20,
                            ease: 'Expo.easeIn',
                            onComplete: function () {
                                slideTitleEl.innerHTML = nextSlideTitle;

                                TweenLite.to( slideTitleEl, 0.5, {
                                    autoAlpha: 1,
                                    y: 0,
                                })
                            }
                        });

                 /*   TweenLite.fromTo( slideStatusEl, 0.5,
                        {
                            autoAlpha: 1,
                            y: 0
                        },
                        {
                            autoAlpha: 0,
                            y: 20,
                            ease: 'Expo.easeIn',
                            onComplete: function () {
                                slideStatusEl.innerHTML = nextSlideStatus;

                                TweenLite.to( slideStatusEl, 0.5, {
                                    autoAlpha: 1,
                                    y: 0,
                                    delay: 0.1,
                                })
                            }
                        });*/

                }
        },5000);

    };

    addEvents();

    window.addEventListener( 'resize' , function(e) {
        renderer.setSize(renderW, renderH);
    });

    let animate = function() {
        requestAnimationFrame(animate);

        renderer.render(scene, camera);
    };
    animate();
};

imagesLoaded( document.querySelectorAll('img'), () => {

    document.body.classList.remove('loading');

    const el = document.getElementById('slider');
    const imgs = Array.from(el.querySelectorAll('.img'));
  new displacementSlider({parent: el,images: imgs});

});


gsap.registerPlugin(ScrollTrigger);

let tl = gsap.timeline({scrollTrigger:{
  trigger:".services",
  start:"top 80%",
  scrub:true,
        onLeave: function(self) {
    self.disable()
    self.animation.progress(1)
  },
  end:"top top",
toggleActions:"restart none none reset"
}})

tl.from(".services h1",{
    opacity:0,
    y:-100,
    duration:1,
}).from(".card",{
    stagger: 0.5,
    y:100,
    opacity:0,
    duration:0.5
},"-=0.5")


let tl1 = gsap.timeline({scrollTrigger:{
  trigger:".about",
  scrub:2,
  start:"top center",
    end:"top top",
      onLeave: function(self) {
    self.disable()
    self.animation.progress(1)
  }
}})

tl1.from(".green-back",{
   x:-400,
   opacity:0,
   duration:1,

}).from(".about-text h1",{
     opacity:0,
     x:-50,
     duration:1,
}).from(".about-text p",{
     opacity:0,
     x:-50,
     duration:1
}).from(".about-text .button-container-2",{
     opacity:0,
     x:-50,
     duration:0.2
},"-=0.7") 
//img-section

let tl2 = gsap.timeline({scrollTrigger:{
  trigger:".img-section",
  //scrub:2,
  start:"top 90%",
    end:"top top",
}})

tl2.to(".left,.right",{
   scaleX:0,
   duration:0.4,

}).from(".contact",{
    opacity:0,
    y:200,
    duration:0.2
})

let tl3 = gsap.timeline({scrollTrigger:{
    trigger:".imgs-1",
    //scrub:2,
    start:"top bottom",
     // end:"top top",
  }})
  
  tl3.from(".imgs-1 .img",{
     y:-200,
     stagger: 0.1,
     duration:0.2,
     opacity:0
  
  }).from(".imgs-2 .img",{
    y:200,
    stagger: 0.1,
    duration:0.2,
    opacity:0
 
 })


 var currentYear= new Date().getFullYear(); 

 document.querySelector(".credit").innerHTML =`© ${currentYear} All rights reserved.`
 /*mapboxgl.accessToken = 'pk.eyJ1IjoiYW1pbmU5MDY2NyIsImEiOiJjbDBhcXFwY3IwMmpkM2pxOWJoeXM3b2tsIn0.27oBN36wOafP6zyGPdIAqQ';
 mapboxgl.accessToken = 'pk.eyJ1IjoiYW1pbmU5MDY2NyIsImEiOiJjbDBhcXFwY3IwMmpkM2pxOWJoeXM3b2tsIn0.27oBN36wOafP6zyGPdIAqQ';
 const map = new mapboxgl.Map({
 style: 'mapbox://styles/amine90667/cl0asnxeo005z15muppdqwxfn',
 center: [-0.5705154293501243, 35.7388395039106],
 zoom: 15.5,
 pitch: 45,
 bearing: -17.6,
 container: 'map',
 antialias: true
 });
  
 map.on('load', () => {
 // Insert the layer beneath any symbol layer.
 const layers = map.getStyle().layers;
 const labelLayerId = layers.find(
 (layer) => layer.type === 'symbol' && layer.layout['text-field']
 ).id;
  
 // The 'building' layer in the Mapbox Streets
 // vector tileset contains building height data
 // from OpenStreetMap.
 map.addLayer(
 {
 'id': 'add-3d-buildings',
 'source': 'composite',
 'source-layer': 'building',
 'filter': ['==', 'extrude', 'true'],
 'type': 'fill-extrusion',
 'minzoom': 15,
 'paint': {
 'fill-extrusion-color': '#aaa',
  
 // Use an 'interpolate' expression to
 // add a smooth transition effect to
 // the buildings as the user zooms in.
 'fill-extrusion-height': [
 'interpolate',
 ['linear'],
 ['zoom'],
 15,
 0,
 15.05,
 ['get', 'height']
 ],
 'fill-extrusion-base': [
 'interpolate',
 ['linear'],
 ['zoom'],
 15,
 0,
 15.05,
 ['get', 'min_height']
 ],
 'fill-extrusion-opacity': 0.6
 }
 },
 labelLayerId
 );
 });*/

 const btn_form = document.querySelector(".form button")

document.querySelector('.form').addEventListener("submit", e => {

    e.preventDefault();

    let name = document.querySelector("#form-name");
    let email = document.querySelector("#form-email");
    let num = document.querySelector("#form-num");
    let msg = document.querySelector("#form-msg");
    
 try {
     btn_form.textContent ="Sending ..."
    emailjs.send("service_st66ias","template_8l7bqvw",{
        from_name: name.value,
        message: msg.value,
        email: email.value,
        number: num.value,
});


  Swal.fire({
  //position: 'top-end',
  icon: 'success',
  title: 'votre message a été envoyé',
  showConfirmButton: false,
  theme: "dark",
  timer: 1500
})
   btn_form.textContent ="Envoyer"
 }
 catch (e) {
 
Swal.fire({
  icon: 'error',
  title: 'Oops...',
  text: "Quelque chose s'est mal passé !",

})
 }


    name.value ="";
    email.value ="";
    num.value ="";
    msg.value ="";

})

 mapboxgl.accessToken = 'pk.eyJ1IjoiYW1pbmU5MDY2NyIsImEiOiJjbDBhcXFwY3IwMmpkM2pxOWJoeXM3b2tsIn0.27oBN36wOafP6zyGPdIAqQ';
const map = new mapboxgl.Map({
style: 'mapbox://styles/amine90667/cl0asnxeo005z15muppdqwxfn',
center: [-0.5705154293501243, 35.7388395039106],
zoom:16,
//zoom: 15,
//pitch: 1,
//bearing: -17.6,
/*zoom: 3.5,
pitch: 45,
bearing: -17.6,*/
container: 'map',
//antialias: true
});
 
//map.scrollZoom.disable();

const bounds = new mapboxgl.LngLatBounds();

[{
  coordinates:[-0.5705609108941451,35.73876273734909 ]
}].forEach(loc => {
  // Create marker
  const el = document.createElement('div');
  //el.className = 'marker';

  // Add marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom'
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Add popup
  new mapboxgl.Popup({
    offset: 25,
    closeOnClick: false,
                closeButton: false,//<----
            closeOnClick: false,
            closeOnMove: false,
    focusAfterOpen: false,
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<img src="icons/NewPaintL.svg" class="marker">`)
    .addTo(map);

  // Extend map bounds to include current location
 // bounds.extend(loc.coordinates);

});
//map.scrollWheelZoom.disable();
/*
map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100
  }
});*/
//map.scrollZoom.disable();
/*
Swal.fire({
  position: 'top-end',
  icon: 'success',
  title: 'votre message a été envoyé',
  showConfirmButton: false,
  theme: "dark",
  timer: 1500
})*/

/*
(function() {
    window.scrollTo(0,0)
  })();
*/
/* Please ❤ this if you like it! */



(function($) { "use strict";

	//Switch dark/light
	
		
	$(document).ready(function(){"use strict";
	
		//Scroll back to top
		
		var progressPath = document.querySelector('.progress-wrap path');
		var pathLength = progressPath.getTotalLength();
		progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
		progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
		progressPath.style.strokeDashoffset = pathLength;
		progressPath.getBoundingClientRect();
		progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';		
		var updateProgress = function () {
			var scroll = $(window).scrollTop();
			var height = $(document).height() - $(window).height();
			var progress = pathLength - (scroll * pathLength / height);
			progressPath.style.strokeDashoffset = progress;
		}
		updateProgress();
		$(window).scroll(updateProgress);	
		var offset = 50;
		var duration = 550;
		jQuery(window).on('scroll', function() {
			if (jQuery(this).scrollTop() > offset) {
				jQuery('.progress-wrap').addClass('active-progress');
			} else {
				jQuery('.progress-wrap').removeClass('active-progress');
			}
		});				
		jQuery('.progress-wrap').on('click', function(event) {
			event.preventDefault();
			jQuery('html, body').animate({scrollTop: 0}, 0);
			return false;
		})
		
		
	});
	
})(jQuery); 
	
