// Animation Configuration
const config = {
	columns: 4,
	rows: 4,
	imageWidth: 2,
	imageHeight: 1.2,
	spacing: 0.5,
	staggerDelay: 0.1,
	cylinderRadius: 5,
	totalImages: 16,
	rotationSpeed: 0.5,
	finalRowImages: 8, // Images in the final row configuration
	finalRowColumns: 2,
	finalRowRows: 2
  };
  
  // Timeline phases
  const add = 0; // Adjustable offset
  const phases = {
	logoFadeIn: {
	  start: 0,
	  duration: 3
	},
	cameraZoom: {
	  start: 1.5,
	  duration: 1
	},
	linesGrow: {
	  start: 1.3,
	  duration: 1.5
	},
	billboardsFade: {
	  start: 0.1 + add,
	  duration: 1.5
	},
	billboardsMove: {
	  start: 5.5 + add, // 1.5 + 4
	  duration: 1.3
	},
	linesShrink: {
	  start: 6 + add, // 1.5 + 4 + 2
	  duration: 0.8
	},
	billboardsMoveBack: {
	  start: 9 + add, // 1.5 + 4 + 2 + 1.3
	  duration: 10
	},
	zoomIn: {
	  start: 17 + add, // 1.5 + 4 + 2 + 1.3
	  duration: 15
	},
	// Additional phases for our specific animation
	staggeredAppearance: {
	  start: 0,
	  duration: 2
	},
	alignRows: {
	  start: 2,
	  duration: 1.5
	},
	formCurve: {
	  start: 3.5,
	  duration: 2
	},
	completeCylinder: {
	  start: 5.5,
	  duration: 1.5
	},
	cylinderRotation: {
	  start: 7,
	  duration: 6
	},
	breakToRow: {
	  start: 13,
	  duration: 2
	},
	scrollRow: {
	  start: 15,
	  duration: 3
	},
	formFinalGrid: {
	  start: 18,
	  duration: 2
	}
  };
  
  // Initialize Three.js scene
  let scene, camera, renderer, clock;
  let imageGroup, images = [];
  
  // Image textures
  const textureLoader = new THREE.TextureLoader();
  const imageSources = Array(config.totalImages).fill().map((_, i) => 
	`https://picsum.photos/400/240`); // Placeholder images
  const textures = [];
  
  // Animation state
  let animationTime = 0;
  let cylinderRotationSpeed = 0;
  let currentPhase = '';
  
  function init() {
	// Create scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	
	// Create camera
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.z = 15;
	
	// Create renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	document.body.appendChild(renderer.domElement);
	
	// Initialize clock
	clock = new THREE.Clock();
	
	// Create image container group
	imageGroup = new THREE.Group();
	scene.add(imageGroup);
	
	// Load textures
	loadTextures().then(createImages);
	
	// Set up window resize handler
	window.addEventListener('resize', onWindowResize);
	
	// Start animation loop
	animate();
  }
  
  function loadTextures() {
	const promises = imageSources.map(src => 
	  new Promise(resolve => {
		textureLoader.load(src, texture => {
		  textures.push(texture);
		  resolve();
		});
	  })
	);
	return Promise.all(promises);
  }
  
  function createImages() {
	// Calculate total width and height of the grid
	const totalWidth = config.columns * (config.imageWidth + config.spacing) - config.spacing;
	const totalHeight = config.rows * (config.imageHeight + config.spacing) - config.spacing;
	
	// Create images
	for (let i = 0; i < config.totalImages; i++) {
	  const row = Math.floor(i / config.columns);
	  const col = i % config.columns;
	  
	  // Create geometry and material
	  const geometry = new THREE.PlaneGeometry(config.imageWidth, config.imageHeight);
	  const material = new THREE.MeshBasicMaterial({ 
		map: textures[i],
		transparent: true,
		opacity: 0
	  });
	  
	  // Create mesh
	  const image = new THREE.Mesh(geometry, material);
	  
	  // Set initial position (off-screen)
	  const xPos = (col * (config.imageWidth + config.spacing)) - (totalWidth / 2) + (config.imageWidth / 2);
	  const yPos = -(row * (config.imageHeight + config.spacing)) + (totalHeight / 2) - (config.imageHeight / 2);
	  
	  // Alternating left/right off-screen positioning
	  const offscreenOffset = 20;
	  image.position.set(
		(i % 2 === 0) ? -offscreenOffset : offscreenOffset,
		yPos,
		0
	  );
	  
	  // Store target grid position for animation
	  image.userData = {
		gridPosition: new THREE.Vector3(xPos, yPos, 0),
		index: i,
		row: row,
		col: col,
		cylinderPosition: new THREE.Vector3(),
		cylinderRotation: new THREE.Euler(),
		finalRowPosition: new THREE.Vector3()
	  };
	  
	  // Add to scene and array
	  imageGroup.add(image);
	  images.push(image);
	}
	
	// Calculate cylinder positions
	calculateCylinderPositions();
	
	// Calculate final row positions
	calculateFinalRowPositions();
  }
  
  function calculateCylinderPositions() {
	const angleIncrement = (Math.PI * 2) / config.totalImages;
	
	images.forEach((image, i) => {
	  // Calculate angle for this image around the cylinder
	  const angle = i * angleIncrement;
	  
	  // Calculate position on cylinder
	  const x = config.cylinderRadius * Math.sin(angle);
	  const z = config.cylinderRadius * Math.cos(angle);
	  
	  // Calculate rotation to face outward from cylinder
	  const rotationY = angle + Math.PI; // Face outward
	  
	  // Store in userData
	  image.userData.cylinderPosition = new THREE.Vector3(x, image.userData.gridPosition.y, z);
	  image.userData.cylinderRotation = new THREE.Euler(0, rotationY, 0);
	});
  }
  
  function calculateFinalRowPositions() {
	// Final row configuration (horizontal row that will then form the 2x2 grid)
	const rowSpacing = config.imageWidth + config.spacing;
	
	images.forEach((image, i) => {
	  if (i < config.finalRowImages) {
		// Position in a single row
		const xPos = (i * rowSpacing) - ((config.finalRowImages - 1) * rowSpacing / 2);
		image.userData.finalRowPosition = new THREE.Vector3(xPos, 0, 0);
		
		// Final 2x2 grid position (for the first 4 images)
		if (i < 4) {
		  const finalCol = i % config.finalRowColumns;
		  const finalRow = Math.floor(i / config.finalRowColumns);
		  
		  const finalGridWidth = config.finalRowColumns * (config.imageWidth + config.spacing) - config.spacing;
		  const finalGridHeight = config.finalRowRows * (config.imageHeight + config.spacing) - config.spacing;
		  
		  const finalXPos = (finalCol * (config.imageWidth + config.spacing)) - (finalGridWidth / 2) + (config.imageWidth / 2);
		  const finalYPos = -(finalRow * (config.imageHeight + config.spacing)) + (finalGridHeight / 2) - (config.imageHeight / 2);
		  
		  image.userData.finalGridPosition = new THREE.Vector3(finalXPos, finalYPos, 0);
		}
	  }
	});
  }
  
  function animate() {
	requestAnimationFrame(animate);
	
	// Update time
	const deltaTime = clock.getDelta();
	animationTime += deltaTime;
	
	// Update animations
	updateAnimation();
	
	// Render scene
	renderer.render(scene, camera);
  }
  
  function updateAnimation() {
	// Determine current phase
	currentPhase = determineCurrentPhase();
	
	// Update based on current phase
	switch (currentPhase) {
	  case 'staggeredAppearance':
		animateStaggeredAppearance();
		break;
	  case 'alignRows':
		animateAlignRows();
		break;
	  case 'formCurve':
		animateFormCurve();
		break;
	  case 'completeCylinder':
		animateCompleteCylinder();
		break;
	  case 'cylinderRotation':
		animateCylinderRotation();
		break;
	  case 'breakToRow':
		animateBreakToRow();
		break;
	  case 'scrollRow':
		animateScrollRow();
		break;
	  case 'formFinalGrid':
		animateFormFinalGrid();
		break;
	}
	
	// Camera movement
	updateCamera();
  }
  
  function determineCurrentPhase() {
	for (const [phaseName, phaseData] of Object.entries(phases)) {
	  const { start, duration } = phaseData;
	  if (animationTime >= start && animationTime <= start + duration) {
		return phaseName;
	  }
	}
	
	// Default to the last phase if beyond all phases
	return 'formFinalGrid';
  }
  
  function getPhaseProgress(phaseName) {
	const { start, duration } = phases[phaseName];
	if (animationTime < start) return 0;
	if (animationTime > start + duration) return 1;
	
	return (animationTime - start) / duration;
  }
  
  function easeInOutQuad(t) {
	return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  
  function easeOutQuint(t) {
	return 1 - Math.pow(1 - t, 5);
  }
  
  function animateStaggeredAppearance() {
	const phaseProgress = getPhaseProgress('staggeredAppearance');
	
	images.forEach((image, i) => {
	  // Calculate staggered timing
	  const staggeredStart = config.staggerDelay * i;
	  const staggeredDuration = phases.staggeredAppearance.duration - staggeredStart;
	  let imageProgress = (phaseProgress * phases.staggeredAppearance.duration - staggeredStart) / staggeredDuration;
	  imageProgress = Math.max(0, Math.min(1, imageProgress));
	  
	  // Ease the progress
	  const easedProgress = easeInOutQuad(imageProgress);
	  
	  // Fade in
	  image.material.opacity = easedProgress;
	  
	  // Move from off-screen to grid position
	  const startX = (i % 2 === 0) ? -20 : 20;
	  image.position.x = THREE.MathUtils.lerp(startX, image.userData.gridPosition.x, easedProgress);
	  image.position.y = image.userData.gridPosition.y;
	  image.position.z = 0;
	  
	  // Scale effect
	  const scale = THREE.MathUtils.lerp(0.8, 1, easedProgress);
	  image.scale.set(scale, scale, scale);
	});
  }
  
  function animateAlignRows() {
	const phaseProgress = getPhaseProgress('alignRows');
	const easedProgress = easeInOutQuad(phaseProgress);
	
	// Ensure all images are fully visible
	images.forEach(image => {
	  image.material.opacity = 1;
	  
	  // Perfect alignment to grid
	  image.position.x = image.userData.gridPosition.x;
	  image.position.y = image.userData.gridPosition.y;
	  image.position.z = 0;
	  
	  // Slight hover effect
	  const hoverOffset = Math.sin(animationTime * 2 + image.userData.index * 0.5) * 0.05;
	  image.position.y += hoverOffset;
	});
  }
  
  function animateFormCurve() {
	const phaseProgress = getPhaseProgress('formCurve');
	const easedProgress = easeInOutQuad(phaseProgress);
	
	images.forEach(image => {
	  // Start transitioning to cylinder position
	  const gridPos = image.userData.gridPosition;
	  const cylPos = image.userData.cylinderPosition;
	  
	  // For position, transition part way to cylinder
	  image.position.x = THREE.MathUtils.lerp(gridPos.x, cylPos.x, easedProgress * 0.7);
	  image.position.y = gridPos.y; // Keep y position for now
	  image.position.z = THREE.MathUtils.lerp(0, cylPos.z, easedProgress * 0.7);
	  
	  // Start rotating to face outward
	  const rotationY = easedProgress * image.userData.cylinderRotation.y * 0.7;
	  image.rotation.y = rotationY;
	});
  }
  
  function animateCompleteCylinder() {
	const phaseProgress = getPhaseProgress('completeCylinder');
	const easedProgress = easeOutQuint(phaseProgress);
	
	images.forEach(image => {
	  // Complete transition to cylinder position
	  const prevX = image.position.x;
	  const prevZ = image.position.z;
	  const cylPos = image.userData.cylinderPosition;
	  
	  // For position, complete transition to cylinder
	  const startProgress = 0.7; // The progress we reached in the previous phase
	  const currentProgress = startProgress + (1 - startProgress) * easedProgress;
	  
	  image.position.x = THREE.MathUtils.lerp(
		image.userData.gridPosition.x, 
		cylPos.x, 
		currentProgress
	  );
	  
	  image.position.y = image.userData.gridPosition.y;
	  
	  image.position.z = THREE.MathUtils.lerp(
		0, 
		cylPos.z, 
		currentProgress
	  );
	  
	  // Complete rotation to face outward
	  const prevRotY = image.rotation.y;
	  const targetRotY = image.userData.cylinderRotation.y;
	  
	  image.rotation.y = THREE.MathUtils.lerp(
		prevRotY,
		targetRotY,
		easedProgress
	  );
	});
  }
  
  function animateCylinderRotation() {
	const phaseProgress = getPhaseProgress('cylinderRotation');
	
	// Ramp up rotation speed using easing
	const rampUpDuration = 0.3; // 30% of the phase for ramping up
	let speedFactor;
	
	if (phaseProgress < rampUpDuration) {
	  // Ramp up
	  speedFactor = easeInOutQuad(phaseProgress / rampUpDuration);
	} else if (phaseProgress > 0.7) {
	  // Ramp down toward the end
	  speedFactor = easeOutQuint(1 - (phaseProgress - 0.7) / 0.3);
	} else {
	  // Full speed in the middle
	  speedFactor = 1;
	}
	
	// Apply rotation to the image group
	cylinderRotationSpeed = config.rotationSpeed * speedFactor;
	imageGroup.rotation.y += cylinderRotationSpeed * 0.05;
	
	// Keep images in cylinder formation
	images.forEach(image => {
	  image.position.copy(image.userData.cylinderPosition);
	  image.rotation.copy(image.userData.cylinderRotation);
	});
  }
  
  function animateBreakToRow() {
	const phaseProgress = getPhaseProgress('breakToRow');
	const easedProgress = easeInOutQuad(phaseProgress);
	
	// Reset group rotation
	imageGroup.rotation.y = THREE.MathUtils.lerp(
	  imageGroup.rotation.y,
	  0,
	  easedProgress
	);
	
	// Transition to a horizontal row
	images.forEach((image, i) => {
	  if (i < config.finalRowImages) {
		// Move towards final row position
		image.position.x = THREE.MathUtils.lerp(
		  image.userData.cylinderPosition.x,
		  image.userData.finalRowPosition.x,
		  easedProgress
		);
		
		image.position.y = THREE.MathUtils.lerp(
		  image.userData.cylinderPosition.y,
		  image.userData.finalRowPosition.y,
		  easedProgress
		);
		
		image.position.z = THREE.MathUtils.lerp(
		  image.userData.cylinderPosition.z,
		  0,
		  easedProgress
		);
		
		// Reset rotation
		image.rotation.y = THREE.MathUtils.lerp(
		  image.userData.cylinderRotation.y,
		  0,
		  easedProgress
		);
	  } else {
		// Fade out images not needed in final row
		image.material.opacity = 1 - easedProgress;
	  }
	});
  }
  
  function animateScrollRow() {
	const phaseProgress = getPhaseProgress('scrollRow');
	const easedProgress = easeInOutQuad(phaseProgress);
	
	// Scroll the row to the left
	const scrollAmount = 15 * easedProgress;
	
	images.forEach((image, i) => {
	  if (i < config.finalRowImages) {
		// Move row to the left
		image.position.x = image.userData.finalRowPosition.x - scrollAmount;
		image.position.y = image.userData.finalRowPosition.y;
		image.position.z = 0;
		image.rotation.set(0, 0, 0);
	  }
	});
  }
  
  function animateFormFinalGrid() {
	const phaseProgress = getPhaseProgress('formFinalGrid');
	const easedProgress = easeOutQuint(phaseProgress);
	
	// Form the final 2x2 grid with the first 4 images
	images.forEach((image, i) => {
	  if (i < 4) {
		// Move to final grid position
		image.position.x = THREE.MathUtils.lerp(
		  image.position.x,
		  image.userData.finalGridPosition.x,
		  easedProgress
		);
		
		image.position.y = THREE.MathUtils.lerp(
		  image.position.y,
		  image.userData.finalGridPosition.y,
		  easedProgress
		);
	  } else if (i < config.finalRowImages) {
		// Fade out the rest of the row
		image.material.opacity = 1 - easedProgress;
	  }
	});
  }
  
  function updateCamera() {
	// Camera movements based on phases
	if (currentPhase === 'staggeredAppearance') {
	  // Slightly pull back during initial appearance
	  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 16, 0.05);
	} else if (currentPhase === 'formCurve' || currentPhase === 'completeCylinder') {
	  // Pull back to see the cylinder forming
	  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 18, 0.05);
	} else if (currentPhase === 'cylinderRotation') {
	  // Subtle movement during rotation
	  const wobble = Math.sin(animationTime) * 0.5;
	  camera.position.y = THREE.MathUtils.lerp(camera.position.y, wobble, 0.05);
	} else if (currentPhase === 'breakToRow') {
	  // Reset camera position
	  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.05);
	  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 15, 0.05);
	} else if (currentPhase === 'formFinalGrid') {
	  // Zoom in slightly for the final grid
	  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 12, 0.05);
	}
  }
  
  function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  // Begin the animation
  init();