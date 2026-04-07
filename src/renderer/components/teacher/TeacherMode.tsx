import { useGradingStore } from '../../stores/grading-store'
import { useGrading } from '../../hooks/useGrading'
import StepIndicator from './StepIndicator'
import AssignmentPicker from './AssignmentPicker'
import ProvisionalProgress from './ProvisionalProgress'
import CalibrationView from './CalibrationView'
import RecalibrationSummary from './RecalibrationSummary'
import ReviewQueue from './ReviewQueue'
import PublishSummary from './PublishSummary'

export default function TeacherMode() {
  const { currentStep } = useGradingStore()

  // Initialize grading IPC listeners
  useGrading()

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: '#0a0f0d' }}>
      {/* Step indicator */}
      <div style={{ padding: '8px 20px 0', borderBottom: '1px solid #1a2420' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#e8ede9', margin: 0, whiteSpace: 'nowrap' }}>
            Teacher Mode
          </h1>
          <StepIndicator currentStep={currentStep} />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col min-h-0">
        {currentStep === 'assignment-select' && <AssignmentPicker />}
        {currentStep === 'provisional'       && <ProvisionalProgress />}
        {currentStep === 'calibration'       && <CalibrationView />}
        {currentStep === 'recalibration'     && <RecalibrationSummary />}
        {currentStep === 'review'            && <ReviewQueue />}
        {currentStep === 'publish'           && <PublishSummary />}
      </div>
    </div>
  )
}
