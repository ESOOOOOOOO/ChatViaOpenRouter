import React from 'react';

interface DotsLoadingProps {
  size?: number; // 点的大小
  color?: string; // 点的颜色
  speed?: number; // 动画速度（秒）
}

const DotsLoading: React.FC<DotsLoadingProps> = ({
  size = 6,
  color = '#FFA000',
  speed = 0.8,
}) => {
  const dotStyle: React.CSSProperties = {
    width: size,
    height: size,
    backgroundColor: color,
    borderRadius: '50%',
    display: 'inline-block',
    margin: `0 ${size / 2}px`,
    animation: `dotFlashing ${speed}s infinite linear alternate`,
  };

  return (
    <div
      style={{
        display: 'inline-flex', // 改成 inline-flex 保证和文字同行
        alignItems: 'center',   // 垂直居中
        verticalAlign: 'middle', // 基线对齐
        height:"48px",
        width:"48px",
        paddingLeft:"12px"
      }}
    >
      <span style={{ ...dotStyle, animationDelay: `0s` }}></span>
      <span style={{ ...dotStyle, animationDelay: `${speed / 2}s` }}></span>
      <span style={{ ...dotStyle, animationDelay: `${speed}s` }}></span>

      <style>{`
        @keyframes dotFlashing {
          0% { opacity: 0.2; transform: translateY(0px); }
          50% { opacity: 1; transform: translateY(-3px); }
          100% { opacity: 0.2; transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

export default DotsLoading;
