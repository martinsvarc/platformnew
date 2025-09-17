import PaymentForm from '../components/PaymentForm'
import StatsDashboard from '../components/StatsDashboard'
import League from '../components/League'

function NewPayment() {
  return (
    <div className="min-h-screen p-2">
      <div className="w-full space-y-4">
            {/* Header */}
            <div className="text-center mb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">
                Nová Platba
              </h1>
              <p className="text-pearl/70 text-xs md:text-sm">
                Odesílejte platby a sledujte svůj výkon
              </p>
            </div>

        {/* Payment Form */}
        <PaymentForm />

        {/* Performance Dashboard & League */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {/* Performance Dashboard */}
              <div className="flex flex-col h-full">
                <h2 className="text-lg md:text-xl font-bold text-gradient-gold mb-2 text-center">
                  Tvůj Výkon
                </h2>
                <StatsDashboard />
              </div>

              {/* League */}
              <div className="flex flex-col h-full">
                <h2 className="text-lg md:text-xl font-bold text-gradient-gold mb-2 text-center">
                  Liga
                </h2>
                <League />
              </div>
        </div>
      </div>
    </div>
  )
}

export default NewPayment
