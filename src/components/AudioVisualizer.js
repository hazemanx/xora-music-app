import React, { useRef, useEffect } from 'react';

const AudioVisualizer = React.forwardRef(({ type, audioContext, sourceNode, className }, ref) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyzerRef = useRef(null);

  useEffect(() => {
    if (!audioContext || !sourceNode || !canvasRef.current) return;

    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    sourceNode.connect(analyzer);
    analyzerRef.current = analyzer;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      analyzer.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(226, 226, 226, 0.1)'; // cyber-silver with low opacity
      
      // Minimal line visualization
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      
      const sliceWidth = width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = '#FF0033'; // cyber-accent color
      ctx.lineWidth = 2;
      ctx.stroke();
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      sourceNode.disconnect(analyzer);
    };
  }, [audioContext, sourceNode]);

  return (
    <canvas 
      ref={canvasRef}
      className={`${className} bg-cyber-black`}
      width={1000}
      height={200}
    />
  );
});

export default AudioVisualizer; 