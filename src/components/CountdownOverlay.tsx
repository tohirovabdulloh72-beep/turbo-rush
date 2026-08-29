import React, { useEffect, useState } from 'react';

interface CountdownOverlayProps {
  onComplete?: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number>(3);
  const [text, setText] = useState<string>('3');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setCount(2);
      setText('2');
    }, 1000);

    const t2 = setTimeout(() => {
      setCount(1);
      setText('1');
    }, 2000);

    const t3 = setTimeout(() => {
      setCount(0);
      setText('GO!');
    }, 3000);

    const t4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const getColorClass = () => {
    switch (count) {
      case 3:
        return 'text-red-500 border-red-500/50 shadow-red-500/50';
      case 2:
        return 'text-amber-500 border-amber-500/50 shadow-amber-500/50';
      case 1:
        return 'text-yellow-400 border-yellow-400/50 shadow-yellow-400/50';
      default:
        return 'text-emerald-400 border-emerald-400/50 shadow-emerald-400/50';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-30 select-none">
      <div key={text} className="animate-ping absolute text-8xl sm:text-[180px] font-black italic opacity-20 tracking-tighter text-white">
        {text}
      </div>
      <div
        key={`main-${text}`}
        className={`transform transition-all duration-300 scale-100 text-8xl sm:text-[180px] font-black italic tracking-tighter drop-shadow-[0_0_50px_rgba(255,255,255,0.7)] ${getColorClass()}`}
      >
        {text}
      </div>
      <div className="mt-6 text-xs sm:text-sm font-bold text-white/70 uppercase tracking-[0.3em] bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-xl">
        Tayyorlaning! / Get Ready!
      </div>
    </div>
  );
};
