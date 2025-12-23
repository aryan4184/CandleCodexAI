import './App.css'
import Header from "./assets/components/header/header.jsx";
import AppRouter from "./assets/router/router.jsx"

function App() {
  return (
    <>
      <Header />
      <main style={{ padding: "40px" }}>
        Your page content here
      </main>
      <Footer />
    </>
  );
}


export default App
