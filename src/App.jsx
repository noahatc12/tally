import { HabitsProvider } from './context/HabitsContext.jsx'
import TodayScreen from './components/TodayScreen.jsx'
import CelebrationLayer from './components/CelebrationLayer.jsx'

export default function App() {
  return (
    <HabitsProvider>
      <div className="app">
        <div className="container">
          <TodayScreen />
        </div>
      </div>
      <CelebrationLayer />
    </HabitsProvider>
  )
}
