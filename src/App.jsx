import Upload from "./Upload";
import "./App.css";
function App() {

  return (
    <div>

<div className="w-full bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 px-8 py-4 flex items-center shadow-lg">

  <h1 className="text-2xl font-bold text-white tracking-wide">
    Portable Log Analyzer
  </h1>

</div>

      <Upload/>

    </div>
  );
}

export default App;