import React, { useEffect } from 'react';

interface AdBannerProps {
  slot: string; // ID do bloco de anúncio gerado no AdSense
  style?: React.CSSProperties;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ slot, style, className }) => {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle && import.meta.env.PROD) {
        (window as any).adsbygoogle.push({});
      }
    } catch (e) {
      console.error('Erro ao carregar anúncio:', e);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className || ''}`}
      style={style || { display: 'block', textAlign: 'center' }}
      data-ad-client="ca-pub-9362715473597213"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
};

export default AdBanner;
