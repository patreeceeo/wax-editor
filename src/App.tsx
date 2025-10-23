import './App.css'
import VariableInput from './components/VariableInput'

function App() {

  return (
    <VariableInput
      onChange={(value) => {
        console.log(`Variable name changed to: ${value}`);
      }}
    />
  )
}

export default App
