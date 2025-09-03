import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import InfiniteScrollLogos from "@/components/InfiniteScrollLogos";
import FadeContent from "@/reactbits/animations/FadeContent/FadeContent";
import { Button } from "@/components/ui/button";

const clients = [
  { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
  { name: "abbvie", logo: "https://logos-world.net/wp-content/uploads/2023/05/AbbVie-Logo.png" },
  { name: "Kraft", logo: "https://logos-world.net/wp-content/uploads/2023/02/Kraft-Foods-Logo.png" },
  { name: "United Airlines", logo: "https://logos-world.net/wp-content/uploads/2020/11/United-Airlines-Logo.png" },
  { name: "BP", logo: "https://logos-world.net/wp-content/uploads/2020/08/BP-Logo.png" },
  { name: "Chegg", logo: "https://logos-world.net/wp-content/uploads/2023/08/Chegg-Logo.png" },
  { name: "Salesforce", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />

      {/* Business & Tech Strategy Section */}
      <section className="py-24 bg-gradient-to-br from-navy-deep via-navy-medium to-navy-light relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        <div className="section-container relative z-10">
          <div className="text-center mb-20">
            <FadeContent delay={0.1}>
              <div className="inline-flex items-center gap-2 bg-teal-primary/10 border border-teal-primary/20 rounded-full px-4 py-2 mb-6">
                <div className="w-2 h-2 bg-teal-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium text-teal-primary">Our Expertise</span>
              </div>
            </FadeContent>

            <FadeContent delay={0.2}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 max-w-5xl mx-auto">
                We create{" "}
                <span className="bg-clip-text bg-gradient-to-r from-teal-primary to-blue-accent">
                  well-informed
                </span>{" "}
                and{" "}
                <span className="bg-clip-text bg-gradient-to-r from-blue-accent to-cyan-accent">
                  scalable
                </span>{" "}
                business solutions
              </h2>
            </FadeContent>

            <FadeContent delay={0.3}>
              <p className="text-xl text-white/85 max-w-3xl mx-auto">
                Delivering strategic insights that drive measurable results for our clients across industries
              </p>
            </FadeContent>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Card 1 */}
            <FadeContent delay={0.4}>
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-primary/20 to-blue-accent/20 rounded-2xl blur-xl transition-all duration-500 group-hover:blur-2xl" />
                <div className="relative bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:border-teal-primary/30 transition-all duration-500 hover:transform hover:scale-105 shadow-2xl">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-primary to-teal-light rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-500 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-teal-primary/20 rounded-2xl animate-ping group-hover:animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-teal-primary mb-6 group-hover:text-white transition-colors duration-500">
                    Business Strategy
                  </h3>
                  <p className="text-lg text-white/90 leading-relaxed mb-6">
                    We strive to effectively tackle our clients' short and long term business challenges across areas such as
                    market entry, competitor analysis, acquisitions, and product development.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["Market Entry", "Competitor Analysis", "Growth Strategy"].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-teal-primary/10 text-teal-primary text-sm rounded-full border border-teal-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </FadeContent>

            {/* Card 2 */}
            <FadeContent delay={0.6}>
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-accent/20 to-cyan-accent/20 rounded-2xl blur-xl transition-all duration-500 group-hover:blur-2xl" />
                <div className="relative bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:border-blue-accent/30 transition-all duration-500 hover:transform hover:scale-105 shadow-2xl">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-accent to-cyan-accent rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-500 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-blue-accent/20 rounded-2xl animate-ping group-hover:animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-accent mb-6 group-hover:text-white transition-colors duration-500">
                    Tech Strategy
                  </h3>
                  <p className="text-lg text-white/90 leading-relaxed mb-6">
                    We specialize in assisting our client companies in their technical endeavors through analysis of emerging
                    technologies, research of potential applications, and strategic implementation.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["Tech Analysis", "Innovation Strategy", "Digital Transform"].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-accent/10 text-blue-accent text-sm rounded-full border border-blue-accent/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </FadeContent>
          </div>
        </div>
      </section>

      {/* We have worked with Section */}
      <InfiniteScrollLogos
        title="We have worked with"
        subtitle="Trusted by leading organizations across various industries"
        clients={clients}
      />

      {/* Why Join OTCR Section */}
      <section className="py-24 bg-gradient-to-br from-background via-navy-medium to-navy-deep relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-accent/5 rounded-full blur-3xl" />

        <div className="section-container relative z-10">
          <div className="text-center mb-20">
            <FadeContent delay={0.1}>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-primary/10 to-blue-accent/10 border border-teal-primary/20 rounded-full px-6 py-3 mb-6 backdrop-blur-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-teal-primary to-blue-accent rounded-full animate-pulse" />
                <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-teal-primary to-blue-accent">
                  Join Our Team
                </span>
              </div>
            </FadeContent>

            <FadeContent delay={0.2}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Why Join <span className="bg-clip-text bg-gradient-to-r from-teal-primary to-blue-accent">OTCR</span>?
              </h2>
            </FadeContent>

            <FadeContent delay={0.3}>
              <p className="text-xl text-white/85 max-w-3xl mx-auto">
                Unlock your potential with real-world consulting experience
              </p>
            </FadeContent>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                text: "Work directly with Fortune 500 companies and innovative startups",
                icon: "🏢",
                gradient: "from-teal-primary to-teal-light",
              },
              {
                text: "Develop critical business analysis and strategic thinking skills",
                icon: "🧠",
                gradient: "from-blue-accent to-cyan-accent",
              },
              {
                text: "Build your professional portfolio with meaningful accomplishments",
                icon: "📈",
                gradient: "from-cyan-accent to-teal-primary",
              },
              {
                text: "Connect with industry professionals and like-minded peers",
                icon: "🤝",
                gradient: "from-teal-light to-blue-accent",
              },
            ].map((benefit, index) => (
              <FadeContent key={index} delay={0.4 + index * 0.1}>
                <div className="group relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-20 rounded-2xl blur-xl transition-all duration-500 group-hover:opacity-30 group-hover:blur-2xl`}
                  />
                  <div className="relative bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-500 hover:transform hover:scale-105 shadow-2xl">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-14 h-14 bg-gradient-to-br ${benefit.gradient} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-500 shadow-lg text-2xl`}
                      >
                        {benefit.icon}
                      </div>
                      <div className="flex-1">
                        <span className="text-lg text-white/90 leading-relaxed group-hover:text-white transition-colors duration-300">
                          {benefit.text}
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center text-sm text-white/60 group-hover:text-teal-primary transition-colors duration-300">
                      <span className="mr-2">Learn more</span>
                      <svg
                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </FadeContent>
            ))}
          </div>

          {/* Call to action */}
          <FadeContent delay={0.8}>
            <div className="text-center mt-16">
              <Button
                size="lg"
                className="bg-gradient-to-r from-teal-primary to-blue-accent hover:from-teal-light hover:to-blue-light text-white px-10 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-teal-primary/25"
                onClick={() => navigate("/join")}
              >
                Start Your Journey
              </Button>
            </div>
          </FadeContent>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;