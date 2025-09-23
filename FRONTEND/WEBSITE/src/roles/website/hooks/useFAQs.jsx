import { useState } from "react";

const useFAQs = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [activeTab, setActiveTab] = useState('All');

    // Combined FAQ data with categories
    const allFaqs = [
        {
            category: 'Products',
            question: 'What are the key features of the ionHive Alkaline water purifier?',
            answer: 'The ionHive Alkaline purifier comes fully loaded with a multistage purification process that includes alkaline water purification, reverse osmosis purification and UV purification.',
        },
        {
            category: 'Products',
            question: 'Is a Copper RO water purifier better than a normal RO water purifier?',
            answer: 'A copper water purifier offers several benefits compared to a standard RO purifier. Copper is an essential mineral needed by the human body. The ionHive Copper RO Water Purifier has a copper filter that infuses water with copper. According to the Indian Council of Medical Research (ICMR), consuming 2 liters of water charged with copper daily can provide around 30% of the recommended dietary allowance (RDA) for this vital mineral.',
        },
        {
            category: 'Products',
            question: 'Is using a Copper water purifier safe?',
            answer: 'Yes, using a copper water purifier is completely safe as copper is one of the most important minerals that benefit the human body. Copper can help you reduce weight, avoid inflammation, and improve your overall health. Copper purifiers are effective at killing bacteria in water. When you purchase Pureit’s copper water purifier, you are also providing your body with a variety of health benefits.',
        },
        {
            category: 'Products',
            question: 'Is a Copper water purifier good for your health?',
            answer: 'Yes, copper water purifiers provide 100% safe drinking water by removing all bacteria, viruses, and harmful germs while adding the goodness of copper to your drinking water. ionHive Copper RO water purifier is one such purifier that helps enhance your overall health and well-being.',
        },
        {
            category: 'Service',
            question: 'What to expect during an RO water purifier service visit?',
            answer: 'During an RO water purifier service visit, our technicians conduct a thorough inspection, clean and sanitize the system, make any necessary replacements or adjustments, and provide valuable maintenance recommendations for optimal functionality and longevity, ensuring customer satisfaction.',
        },
        {
            category: 'Service',
            question: 'What if I am facing issues with the water purifier on rent?',
            answer: 'In case of any issues with your RO purifier for home, please switch it off and request a visit from our water-wellness expert via the mobile app. We will visit your place and get it rectified.',
        },
        {
            category: 'Service',
            question: 'What if I do not feel the water taste up to the mark?',
            answer: 'We service your water purifier best according to the parameters below: Quality of your Input Water Volume of Water processed by your Purifie Duration since the Last Service. You`ll receive a Maintenance Due alert on the ionHive mobile app, triggered by the health status of your water purifier and your water consumption patterns. All you need to do is schedule the maintenance check at your convenience.',
        },
        {
            category: 'Service',
            question: 'How often do you service my Water Purifier for home?',
            answer: 'We service it based on usage, water input quality, and alerts from the app...',
        },
        {
            category: 'App',
            question: 'What if My water purifier subscription balance/validity gets over?',
            answer: 'Before your Balance / Validity is over, you will receive a Notification / SMS prompting you to recharge the water purifier subscription. You can do so through the App.',
        },
        {
            category: 'App',
            question: 'I am not at home. Can my family still continue to use the water purifier?',
            answer: 'Absolutely. We advise syncing your water purifier with the app every 15 days. Anybody can sync the purifier by downloading the App and entering the Purifier ID.',
        },
        {
            category: 'App',
            question: 'Do I need to download your App to use the water purifier?',
            answer: 'Yes, you would need to download the App to view your real-time consumption details, Make Payments and Schedule Proactive Maintenance Activities.',
        },
        {
            category: 'App',
            question: 'How do you use IoT to make me feel safe about the water I drink?',
            answer: 'Our remote health monitoring algorithm continuously monitors the devices health.We use this information to schedule proactive maintenance activities, ensuring water purifier’s health.',
        },
        {
            category: 'Security Deposit',
            question: 'I have raised a request for uninstallation. How will my refund amount be calculated?',
            answer: `
                  <div data-state="open" role="region" aria-labelledby="radix-id" class="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" style="--radix-accordion-content-height: var(--radix-collapsible-content-height); --radix-collapsible-content-width: var(--radix-collapsible-content-width); --radix-collapsible-content-height: 352px; --radix-collapsible-content-width: 886px;">
                    <div class="pb-4 pt-0 font-normal text-body">
                      <p>Your refund will be calculated based on the following:</p>
                      <ol class="my-2 list-inside list-disc [&>li]:ml-2">
                        <li><span class="font-semibold">Security Deposit:</span> Your security deposit of Rs. 1500 will be refundable.</li>
                        <li>
                          <span class="font-semibold">Excess Balance:</span>
                          <ul class="my-2 mb-4 list-inside !list-[lower-alpha] [&>li]:ml-4 [&>li]:mt-2">
                            <li>If the cancellation request is raised within 7 days of recharge, the entire payment for that cycle will be refunded.</li>
                            <li>If the cancellation request is raised after 7 days of payment , the charges for the current month will be non-refundable.</li>
                            <li><span class="font-semibold">Long term plans:</span> If you raise a cancellation request prior to completion of a long term plan, the Monthly plan amount will be considered for the number of consumed months instead of the discounted long term plan. Any excess balance will be refunded to you.</li>
                          </ul>
                        </li>
                        <li><span class="font-semibold">Outstanding dues:</span> Any unpaid charges (including for the current month) will be deducted.</li>
                        <li><span class="font-semibold">Lock-in period:</span> If canceled before the 3-month lock-in period ends, charges for that period will be deducted.</li>
                      </ol>
                      <p>To know the exact deductible amount, contact our support team.</p>
                    </div>
                  </div>
                `
        },
        {
            category: 'Security Deposit',
            question: 'When will my security deposit be refunded?',
            answer: 'The security deposit will be reimbursed to the customer within 5 working days upon device pickup. Any outstanding dues from the customer, including unpaid water purifier subscription charges, will be deducted from the security deposit. Additionally, the device will undergo inspection for any damage or abuse, with exceptions for normal wear and tear. If any damage or abuse is identified, the corresponding amount will be deducted from the security deposit.',
        },
    ];

    const categories = ['All', 'Products', 'Service', 'App', 'Security Deposit'];

    const filteredFaqs =
        activeTab === 'All' ? allFaqs : allFaqs.filter((faq) => faq.category === activeTab);

    const handleToggle = (index) => {
        setActiveIndex(index === activeIndex ? null : index);
    }

    return { activeIndex, setActiveIndex, activeTab, setActiveTab, categories, filteredFaqs, handleToggle }
}
export default useFAQs