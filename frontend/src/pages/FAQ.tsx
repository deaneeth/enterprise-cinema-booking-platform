import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const FAQ: React.FC = () => {
  useEffect(() => {
    document.title = "FAQ | CineFlick";
  }, []);

  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const faqCategories: FAQCategory[] = [
    {
      title: "Booking",
      icon: "🎟️",
      items: [
        {
          question: "How do I book movie tickets?",
          answer: "Simply browse movies or cinemas, select your preferred showtime, choose your seats, and proceed to checkout. You can pay using credit/debit card or PayPal. Once payment is confirmed, you'll receive an e-ticket via email.",
        },
        {
          question: "Can I select my seats?",
          answer: "Yes! CineFlick offers interactive seat selection. You can see the screen layout and choose your preferred seats. Different seat types (standard, premium, VIP) may have different prices.",
        },
        {
          question: "How many tickets can I book at once?",
          answer: "You can book up to 10 tickets per transaction. For larger group bookings, please contact our corporate bookings team.",
        },
        {
          question: "Can I book tickets for someone else?",
          answer: "Yes, you can book tickets and share the e-ticket or QR code with the person attending. They'll need to show the QR code at the cinema.",
        },
      ],
    },
    {
      title: "Payment",
      icon: "💳",
      items: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept major credit and debit cards (Visa, MasterCard, American Express), PayPal, and various local payment methods depending on your region.",
        },
        {
          question: "Is my payment information secure?",
          answer: "Absolutely. We use industry-standard SSL encryption and work with trusted payment processors. We never store your complete card details on our servers.",
        },
        {
          question: "Why was my payment declined?",
          answer: "Payments may be declined due to insufficient funds, incorrect card details, card expiration, or security blocks by your bank. Please verify your details or try a different payment method.",
        },
        {
          question: "Do you charge any service fees?",
          answer: "A small convenience fee may be added to cover transaction processing. This is clearly shown before you complete your booking.",
        },
      ],
    },
    {
      title: "Cancellations & Refunds",
      icon: "↩️",
      items: [
        {
          question: "How do I cancel my booking?",
          answer: "Go to your Profile > Booking History, find the booking you want to cancel, and click 'Cancel Booking'. Alternatively, you can cancel from the email confirmation you received.",
        },
        {
          question: "What is your refund policy?",
          answer: "Full refunds are available for cancellations made more than 4 hours before showtime. Cancellations within 4 hours may incur a small fee. No refunds after the show has started.",
        },
        {
          question: "How long do refunds take?",
          answer: "Refunds are typically processed within 5-7 business days. The exact timing depends on your bank or payment provider.",
        },
        {
          question: "What if a show is cancelled?",
          answer: "If a cinema cancels a show, you'll automatically receive a full refund. We'll also notify you via email and SMS (if provided).",
        },
      ],
    },
    {
      title: "Account",
      icon: "👤",
      items: [
        {
          question: "Do I need an account to book tickets?",
          answer: "While you can browse movies without an account, creating one allows you to book tickets, view booking history, save preferences, and receive personalized recommendations.",
        },
        {
          question: "How do I reset my password?",
          answer: "Click 'Forgot Password' on the login page, enter your email, and we'll send you a reset link. The link expires in 24 hours for security.",
        },
        {
          question: "Can I delete my account?",
          answer: "Yes. Go to Profile > Settings > Delete Account. Note that this action is irreversible and you'll lose access to your booking history.",
        },
        {
          question: "How do I update my email or phone?",
          answer: "Go to Profile > Edit Profile. You can update your personal information including email, phone number, and name.",
        },
      ],
    },
    {
      title: "At the Cinema",
      icon: "🏢",
      items: [
        {
          question: "How do I use my e-ticket?",
          answer: "Show your e-ticket (QR code) from your email or booking history at the cinema entrance. Staff will scan it to grant you entry.",
        },
        {
          question: "Can I buy food and drinks with my booking?",
          answer: "Currently, food and beverage pre-ordering depends on the cinema. Some partners allow this during checkout. Check your selected cinema's options.",
        },
        {
          question: "What if I'm late for my show?",
          answer: "Cinemas typically allow entry up to 15 minutes after the show starts. However, this varies by cinema and you may miss some content.",
        },
        {
          question: "Are cinemas wheelchair accessible?",
          answer: "Most of our partner cinemas are wheelchair accessible. Check the cinema details page for specific accessibility information.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-red-900/20 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Frequently Asked <span className="text-red-500">Questions</span>
          </h1>
          <p className="text-xl text-gray-400">
            Find answers to common questions about using CineFlick
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{category.icon}</span>
                <h2 className="text-2xl font-bold text-white">{category.title}</h2>
              </div>

              <div className="space-y-3">
                {category.items.map((item, itemIndex) => {
                  const itemId = `${catIndex}-${itemIndex}`;
                  const isOpen = openItems[itemId];

                  return (
                    <div
                      key={itemIndex}
                      className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                        <span className="font-medium text-white">{item.question}</span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-400 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-red-900/30 to-purple-900/30 rounded-2xl border border-white/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Still have questions?</h2>
            <p className="text-gray-400 mb-6">
              Our support team is ready to help you with any questions.
            </p>
            <Link
              to="/contact"
              className="inline-block px-8 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
