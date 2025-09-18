const Home = () => {
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#000000',
      color: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '4rem', 
          margin: '0', 
          fontWeight: '300',
          letterSpacing: '-0.02em'
        }}>
          WebTarget
        </h1>
        <div style={{ 
          width: '40px', 
          height: '1px', 
          backgroundColor: '#ffffff', 
          margin: '20px auto' 
        }} />
        <p style={{ 
          fontSize: '1rem', 
          margin: '0', 
          color: '#cccccc',
          letterSpacing: '0.1em'
        }}>
          webtarget.dev
        </p>
      </header>
      <footer style={{ 
        position: 'absolute', 
        bottom: '20px', 
        fontSize: '0.8rem', 
        color: '#666666' 
      }}>
        © 2025 WebTarget
      </footer>
    </div>
  );
};

export default Home;