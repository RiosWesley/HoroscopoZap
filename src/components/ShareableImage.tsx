import React from 'react';

interface ShareableImageProps {
  totalMessages: number;
  generatedSign: string;
  generatedSignoDescription: string;
  mostFrequentEmoji: string | null;
}

// Using forwardRef to allow parent component to get the DOM node
const ShareableImage = React.forwardRef<HTMLDivElement, ShareableImageProps>(
  ({ totalMessages, generatedSign, generatedSignoDescription, mostFrequentEmoji }, ref) => {
    // Basic styling - can be significantly enhanced
    const cardStyle: React.CSSProperties = {
      width: '600px', // Fixed width
      height: '400px', // Fixed height
      // Using a similar gradient to the main app theme
      background: 'linear-gradient(135deg, #6B46C1, #D53F8C)', // Purple to Pink
      color: 'white',
      padding: '40px', // Increased padding
      fontFamily: 'sans-serif',
      display: 'flex', // Keep flex for column layout
      flexDirection: 'column',
      gap: '15px', // Gap between cards
      borderRadius: '15px',
      boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
      // Align items to the top to mimic screenshot structure
      alignItems: 'stretch', // Stretch cards horizontally
      justifyContent: 'flex-start',
      position: 'relative', // Needed for absolute positioning of watermark/emoji
      overflow: 'hidden', // Ensure content stays within bounds
    };

    // --- Card Styles (Mimicking Screenshot) ---
    const cardBaseStyle: React.CSSProperties = {
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // More subtle transparency
      borderRadius: '12px', // Slightly more rounded
      padding: '15px 20px',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
      // backdropFilter: 'blur(3px)', // Subtle blur
    };

    // --- Card 1: Signo ---
    const signoCardStyle: React.CSSProperties = {
      ...cardBaseStyle,
      textAlign: 'center',
      paddingTop: '20px',
      paddingBottom: '20px',
    };
    const signTextStyle: React.CSSProperties = {
      fontSize: '1.8rem', // Slightly smaller
      fontWeight: 'bold',
      lineHeight: 1.2,
      marginBottom: '5px',
    };
    const descriptionTextStyle: React.CSSProperties = {
      fontSize: '0.85rem', // Slightly smaller
      opacity: 0.85,
      maxWidth: '95%',
      margin: '0 auto',
    };

    // --- Card 2 & 3: Stats ---
    const statCardStyle: React.CSSProperties = {
      ...cardBaseStyle,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    };
    const statLabelStyle: React.CSSProperties = {
      fontSize: '0.9rem',
      opacity: 0.8,
    };
    const statValueStyle: React.CSSProperties = {
      fontSize: '1.4rem', // Slightly smaller
      fontWeight: 'bold',
    };
     const emojiValueStyle: React.CSSProperties = {
      fontSize: '2.5rem', // Slightly smaller emoji
    };

    const watermarkStyle: React.CSSProperties = {
       position: 'absolute',
       bottom: '10px',
       right: '15px',
       fontSize: '0.7rem',
       opacity: 0.6,
    };

    return (
      <div ref={ref} style={cardStyle}>
        {/* Card 1: Signo */}
        <div style={signoCardStyle}>
          <div style={signTextStyle}>{generatedSign}</div>
          <div style={descriptionTextStyle}>{generatedSignoDescription}</div>
        </div>

        {/* Card 2: Total Messages */}
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Total de Mensagens</span>
          <span style={statValueStyle}>{totalMessages}</span>
        </div>

        {/* Card 3: Most Frequent Emoji */}
        {mostFrequentEmoji ? (
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Emoji Principal</span>
            <span style={emojiValueStyle}>{mostFrequentEmoji}</span>
          </div>
        ) : (
          // Optional: Render an empty placeholder card or omit if no emoji
          <div style={{...statCardStyle, opacity: 0.5}}>
             <span style={statLabelStyle}>Emoji Principal</span>
             <span style={statValueStyle}>-</span>
          </div>
        )}

        {/* Watermark */}
        <div style={watermarkStyle}>HoroscopoChat</div>
      </div>
    );
  }
);

ShareableImage.displayName = 'ShareableImage'; // Helps in React DevTools

export default ShareableImage;
