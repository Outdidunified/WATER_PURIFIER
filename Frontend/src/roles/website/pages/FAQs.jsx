import { useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
const FAQs = ({ }) => {
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
    };


    return (
        <div>

            {/* Header */}
            < Header />

            <main className="main">

                {/* <!-- Contact Section --> */}
                <section id="hero" className="hero section">

                    {/* <!-- Section Title --> */}
                    <div className="container section-title" data-aos="fade-up">
                        <h2>FAQs</h2>
                        <p>Find Answers To Your Queries</p>
                    </div>
                    {/* <!-- End Section Title --> */}

                </section>

                {/* <!-- Faq Section --> */}
                <section className="faq-9 faq section light-background" id="faq" style={{ padding: '0px' }}>
                    {/* <!-- /Contact Section --> */}
                    <div className="d-flex justify-content-center" style={{ paddingBottom: '20px' }}>
                        <div className="d-flex justify-content-center mb-4 flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    className={`btn btn-sm ${activeTab === cat ? 'btn-primary' : 'btn-outline-dark'}`}
                                    onClick={() => {
                                        setActiveTab(cat);
                                        setActiveIndex(null); // Reset open accordion
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="container">
                        <div className="row">
                            <div className="col-lg-5" data-aos="fade-up">
                                <h2 className="faq-title">Frequently asked questions</h2>
                                <div className="faq-arrow d-none d-lg-block" data-aos="fade-up" data-aos-delay="200">
                                    <svg className="faq-arrow" width="200" height="211" viewBox="0 0 200 211" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M198.804 194.488C189.279 189.596 179.529 185.52 169.407 182.07L169.384 182.049C169.227 181.994 169.07 181.939 168.912 181.884C166.669 181.139 165.906 184.546 167.669 185.615C174.053 189.473 182.761 191.837 189.146 195.695C156.603 195.912 119.781 196.591 91.266 179.049C62.5221 161.368 48.1094 130.695 56.934 98.891C84.5539 98.7247 112.556 84.0176 129.508 62.667C136.396 53.9724 146.193 35.1448 129.773 30.2717C114.292 25.6624 93.7109 41.8875 83.1971 51.3147C70.1109 63.039 59.63 78.433 54.2039 95.0087C52.1221 94.9842 50.0776 94.8683 48.0703 94.6608C30.1803 92.8027 11.2197 83.6338 5.44902 65.1074C-1.88449 41.5699 14.4994 19.0183 27.9202 1.56641C28.6411 0.625793 27.2862 -0.561638 26.5419 0.358501C13.4588 16.4098 -0.221091 34.5242 0.896608 56.5659C1.8218 74.6941 14.221 87.9401 30.4121 94.2058C37.7076 97.0203 45.3454 98.5003 53.0334 98.8449C47.8679 117.532 49.2961 137.487 60.7729 155.283C87.7615 197.081 139.616 201.147 184.786 201.155L174.332 206.827C172.119 208.033 174.345 211.287 176.537 210.105C182.06 207.125 187.582 204.122 193.084 201.144C193.346 201.147 195.161 199.887 195.423 199.868C197.08 198.548 193.084 201.144 195.528 199.81C196.688 199.192 197.846 198.552 199.006 197.935C200.397 197.167 200.007 195.087 198.804 194.488ZM60.8213 88.0427C67.6894 72.648 78.8538 59.1566 92.1207 49.0388C98.8475 43.9065 106.334 39.2953 114.188 36.1439C117.295 34.8947 120.798 33.6609 124.168 33.635C134.365 33.5511 136.354 42.9911 132.638 51.031C120.47 77.4222 86.8639 93.9837 58.0983 94.9666C58.8971 92.6666 59.783 90.3603 60.8213 88.0427Z" fill="currentColor"></path>
                                    </svg>
                                </div>
                            </div>

                            <div className="col-lg-7" data-aos="fade-up" data-aos-delay="300">
                                <div className="faq-container">
                                    {filteredFaqs.slice(0, 5).map((faq, index) => (
                                        <div
                                            key={index}
                                            className={`faq-item p-3 mb-2 rounded border ${activeIndex === index ? 'bg-light' : ''}`}
                                            onClick={() => handleToggle(index)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <h5 className="mb-2 d-flex justify-content-between align-items-center">
                                                {faq.question}
                                                <i className={`bi ${activeIndex === index ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                                            </h5>
                                            {activeIndex === index && (
                                                <div className="mb-0" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
                {/* <!-- /Faq Section --> */}

            </main>

            {/* Footer */}
            < Footer />
        </div>
    );
};
export default FAQs;