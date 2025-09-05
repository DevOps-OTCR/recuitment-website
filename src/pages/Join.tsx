import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ArrowRight, CheckCircle, FileText, Phone, Briefcase, PartyPopper, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import FadeContent from '@/reactbits/animations/FadeContent/FadeContent';
import chicagoSkyline from '/src/assets/chicago_skyline.png';
import SplitText from '@/reactbits/textanimations/SplitText/SplitText';

const benefits = [
  "Work directly with Fortune 500 companies and innovative startups",
  "Develop critical business analysis and strategic thinking skills",
  "Build your professional portfolio with meaningful accomplishments",
  "Connect with industry professionals and like-minded peers"
];

const Join = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center bg-background text-center">
        <div className="absolute inset-0 z-0">
                                <img
                                  src={chicagoSkyline}
                                  alt="University of Illinois campus"
                                  className="w-full h-full object-cover opacity-70"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>
                              </div>
        <div className="w-full flex flex-col items-center relative z-10">
                  <SplitText
                    text="Recruitment Process"
                    className="text-5xl lg:text-6xl font-extrabold text-white text-center mb-6"
                    splitType="words"
                  />
                  <FadeContent delay={1}>
                    <p className="text-xl text-white/90 text-center max-w-3xl mx-auto">
                      Are you a University of Illinois student passionate about business strategy and consulting?
            Join OTCR and gain invaluable experience while making a real impact.
                    </p>
                  </FadeContent>
                </div>
        {/* Scroll arrow */}
        <div className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center animate-bounce-slow">
          <ArrowDown className="w-8 h-8 text-accent" />
          <span className="text-sm text-muted-foreground mt-2">Scroll to know more</span>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="section-container">
          <div className="mb-24">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold text-accent mb-6">Why Join OTCR?</h3>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Discover the benefits of joining our elite consulting team</p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="professional-card p-6 text-center">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-6 h-6 text-accent" />
                    </div>
                    <span className="text-white text-lg block">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mb-16">
            <h3 className="text-4xl font-extrabold text-white mb-6">Application Process</h3>
            <p className="text-xl text-white/85 max-w-3xl mx-auto">Follow our structured recruitment timeline to join our team</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="relative flex flex-col items-center">
              {/* Vertical line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-border z-0" style={{ transform: 'translateX(-50%)' }} />
              {/* Timeline events */}
              {[
                {
                  title: 'Quad Day',
                  date: 'Aug 24',
                  description: (
                    <>
                      Meet us at Quad Day to learn about OTCR and our upcoming events.<br />
                      Stop by our booth on the Main Quad!
                    </>
                  ),
                },
                {
                  title: 'Info Night',
                  date: 'Aug 28',
                  description: (
                    <>
                      Learn more about us and our recruitment process.<br />
                      Dress Code: Business Casual
                    </>
                  ),
                },
                {
                  title: 'First Application Deadline',
                  date: 'Aug 29',
                  description: (
                    <>Submit your application by this deadline. All applications will be evaluated equally regardless of cycle.</>
                  ),
                },
                {
                  title: 'OTCR Q&A',
                  date: 'Sept 2',
                  description: (
                    <>
                      Ask questions about OTCR, our culture, and the application process.<br />
                      Perfect opportunity to get all your questions answered!
                    </>
                  ),
                },
                {
                  title: 'Info Night 2',
                  date: 'Sept 3',
                  description: (
                    <>
                      Second info night for those who missed the first one.<br />
                      Dress Code: Business Casual
                    </>
                  ),
                },
                {
                  title: 'Case Training + Meet and Greet / Dev ops Training',
                  date: 'Sept 4',
                  description: (
                    <>
                      Learn about our case and coding interviews and get to know members of the firm afterwards.<br />
                      Dress Code: Business Casual
                    </>
                  ),
                },
                {
                  title: 'Second Deadline',
                  date: 'Sept 5',
                  description: (
                    <>Final deadline to submit your membership application. All applications will be evaluated equally regardless of cycle.</>
                  ),
                },
              ].map((event, idx, arr) => {
                const isLeft = idx % 2 === 0;
                return (
                  <div key={idx} className="w-full flex flex-col md:flex-row items-center mb-16 last:mb-0 relative">
                    {/* Left side (card if left, empty if right) */}
                    <div className={`md:w-1/2 flex ${isLeft ? 'justify-end' : 'justify-end md:invisible'}`}> {/* invisible keeps spacing */}
                      {isLeft && (
                        <div className="professional-card p-8 max-w-xl w-full">
                          <div className="font-extrabold text-2xl text-white mb-2">{event.title}</div>
                          <div className="font-semibold text-lg text-teal-primary mb-2">{event.date}</div>
                          {event.location && <div className="italic text-base text-white/80 mb-2">{event.location}</div>}
                          <div className="text-base text-white/90">{event.description}</div>
                        </div>
                      )}
                    </div>
                    {/* Timeline circle */}
                    <div className="z-20 flex flex-col items-center w-0 mx-4">
                      <div className="w-8 h-8 rounded-full border-4 border-border bg-background flex items-center justify-center" />
                    </div>
                    {/* Right side (card if right, empty if left) */}
                    <div className={`md:w-1/2 flex ${!isLeft ? 'justify-start' : 'justify-start md:invisible'}`}> {/* invisible keeps spacing */}
                      {!isLeft && (
                        <div className="professional-card p-8 max-w-xl w-full">
                          <div className="font-extrabold text-2xl text-white mb-2">{event.title}</div>
                          <div className="font-semibold text-lg text-teal-primary mb-2">{event.date}</div>
                          {event.location && <div className="italic text-base text-white/80 mb-2">{event.location}</div>}
                          <div className="text-base text-white/90">{event.description}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/*
          <section className="mt-32 mb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-white mb-6">Join Us at Our Events</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">See what happens at our info nights, case trainings, and social events</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {[
                { title: "Info Night", desc: "Learn about OTCR" },
                { title: "Case Training", desc: "Practice interview skills" },
                { title: "Meet & Greet", desc: "Connect with members" },
                { title: "Social Events", desc: "Fun team activities" }
              ].map((event, idx) => (
                <FadeContent key={idx} delay={idx * 0.1}>
                  <div className="image-placeholder aspect-square rounded-xl group">
                    <div className="text-center">
                      <svg className="w-8 h-8 mb-3 mx-auto group-hover:scale-110 transition-transform duration-300 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                      <p className="font-semibold text-sm">{event.title}</p>
                      <p className="text-xs opacity-75">{event.desc}</p>
                    </div>
                  </div>
                </FadeContent>
              ))}
            </div>
          </section>
          */}

          {/* --- INTEREST FORM & APPLICATION CTA --- */}
          <section className="mt-32 mb-24">
            <div className="relative bg-card rounded-2xl flex flex-col items-center justify-center py-16 px-6 lg:px-8 text-center border border-border">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-10 max-w-3xl">
                Fill out our interest form to stay informed about upcoming events, or start working on your application!
              </h2>
              <div className="flex flex-col md:flex-row gap-6 justify-center">
                <a href="#" className="bg-accent hover:bg-accent/90 text-white font-bold py-5 px-12 rounded-lg shadow text-lg transition-colors">Interest Form</a>
                <a href="/otcr-consulting/#/apply" className="bg-white hover:bg-accent/10 text-accent font-bold py-5 px-12 rounded-lg shadow text-lg transition-colors border border-accent">Application</a>
              </div>
            </div>
          </section>

          {/* --- FAQ SECTION --- */}
          <section className="py-24">
            <h2 className="text-4xl font-extrabold text-center mb-16 text-white">FAQ's</h2>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Distribute FAQ items evenly across columns */}
              {[
                [
                  {
                    q: "How much prior experience do I need to join?",
                    a: "None! OTCR promotes collaborative learning through our trainings and project work. All members gain useful business and technical insights throughout their experience in the firm."
                  },
                  {
                    q: "I have some individualized questions on my application?",
                    a: "Please contact us at the link below and/or reach out to us during our info night and meet and greet sessions! We'd love to have a thorough in-person chat with you there."
                  },
                  {
                    q: "What kind of leadership opportunities does OTCR offer?",
                    a: "We offer roles as a full-time consultant, lead consultant, project manager, integrated project manager of our initiatives, and partner. There are various pathways to leadership you can take!"
                  }
                ],
                [
                  {
                    q: "What's the expected time commitment?",
                    a: "Your time commitment varies based on your roles and responsibilities in OTCR, but a typical full-time consultant project runs the length of the semester. Your weekly hours will then depend on your project scope and client feedback."
                  },
                  {
                    q: "What does a semester in OTCR look like?",
                    a: "In addition to project work, our consultants have the chance to attend client visits, enjoy frequent social events, help shape the firm's future through internal initiatives, and much more!"
                  },
                  {
                    q: "How can I prepare more for interviews?",
                    a: "Please utilize our practice cases down below and visit our case training! We will have some excellent tips to get you started."
                  }
                ],
                [
                  {
                    q: "What skills will I develop as a part of OTCR?",
                    a: "You will not only develop the technical skills of consulting such as market research and slide design, but also soft skills such as public speaking and professional interaction."
                  },
                  {
                    q: "Are there any restrictions on who can join OTCR?",
                    a: "None! We welcome all majors and minors regardless of where you hail from."
                  },
                  {
                    q: "What if I don't know if I want to go into consulting?",
                    a: "That's okay! Even if you haven't decided on your career path yet, OTCR will help you develop skills necessary across all professions. Our members gain real-world experience in a variety of industries and roles that they carry with them into countless fields."
                  }
                ]
              ].map((column, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-8">
                  <Accordion type="multiple" className="w-full">
                    {column.map((item, idx) => (
                      <AccordionItem value={`faq-${colIdx}-${idx}`} key={idx}>
                        <AccordionTrigger className="text-lg font-semibold text-white bg-card rounded-t-xl px-6 py-4 border-b border-border">{item.q}</AccordionTrigger>
                        <AccordionContent className="bg-card rounded-b-xl px-6 pb-4 text-white/85 border-b border-border">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </section>

        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Join;
