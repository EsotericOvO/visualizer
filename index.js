const fileInput = document.getElementById("fileInput");
const circle = document.getElementById("circle");
const dustCanvas = document.getElementById("dustCanvas");
const dustCtx = dustCanvas.getContext("2d");
dustCanvas.width = window.innerWidth;
dustCanvas.height = window.innerHeight;

let particles = [];
let lastParticleSpawnTime = 0;
const particleSpawnInterval = 200;

fileInput.addEventListener("change", (e) => {
  const file = fileInput.files[0];
  const audioContext = new AudioContext();
  const source = audioContext.createBufferSource();
  const analyser = audioContext.createAnalyser();
  const gainNode = audioContext.createGain();

  source.connect(analyser);
  analyser.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const reader = new FileReader();
  reader.onload = (event) => {
    audioContext.decodeAudioData(event.target.result, (buffer) => {
      source.buffer = buffer;
      source.start();
      animate(); 
      fileInput.style.display = 'none';
    });
  };
  reader.readAsArrayBuffer(file);

  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  const timeDomainData = new Uint8Array(analyser.fftSize);
  let rotation = 0;
  let currentSize = 400;
  const sizeChangeRate = 0.1;

  function animate() {
    if (source.playbackState === AudioBufferSourceNode.PLAYING_STATE) {
      requestAnimationFrame(animate);
      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeDomainData);

      const amplitude = calculateAmplitude(timeDomainData);
      const targetSize = 300 + amplitude * 200;
      currentSize += (targetSize - currentSize) * sizeChangeRate;
      circle.style.width = `${currentSize}px`;
      circle.style.height = `${currentSize}px`;
      circle.style.borderRadius = '50%';

      const rotationSpeed = amplitude * 40**2;
      rotation += rotationSpeed * 0.005;
      circle.style.transform = `rotate(${rotation}deg)`;

      updateDustParticles(amplitude);
    }
  }
});

function calculateAmplitude(timeDomainData) {
  let sum = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    sum += Math.abs(timeDomainData[i] - 128);
  }
  return sum / timeDomainData.length / 128;
}

function updateDustParticles(amplitude) {
  const currentTime = Date.now();
  if (currentTime - lastParticleSpawnTime > particleSpawnInterval) {
    particles.push(new Particle());
    lastParticleSpawnTime = currentTime;
  }

  dustCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
  particles.forEach((particle, index) => {
    particle.update(amplitude);
    particle.draw();
    if (particle.x > dustCanvas.width) {
      particles.splice(index, 1);
    }
  });
}

class Particle {
  constructor() {
    this.size = Math.random() * 2;
    this.x = 0;
    this.y = Math.random() * dustCanvas.height;
    this.baseSpeed = this.size * 1.5;
    this.alpha = 1;
    this.verticalSpeed = (Math.random() - 0.5) * 2;
  }

  update(amplitude) {
    const loudnessSpeed = amplitude * 14;
    this.x += this.baseSpeed / 4 + loudnessSpeed;
    this.y += this.verticalSpeed;
    this.alpha -= 0.001;
    if (this.alpha <= 0) this.alpha = 0;
  }

  draw() {
    dustCtx.fillStyle = `rgba(255, 0, 0, ${this.alpha})`;
    dustCtx.beginPath();
    dustCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    dustCtx.fill();
  }
}
