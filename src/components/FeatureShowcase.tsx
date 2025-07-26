import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, FileText, PenTool, Search, Settings, Sparkles } from "lucide-react";

const features = [
  {
    icon: <PenTool className="w-8 h-8 text-primary" />,
    title: "AI-Powered Writing",
    description: "Generate entire articles from a simple title or outline. Let AI handle the heavy lifting of drafting content.",
  },
  {
    icon: <Search className="w-8 h-8 text-primary" />,
    title: "Intelligent Research",
    description: "Mithoo automatically researches topics, gathers sources, and provides you with the data you need to write with authority.",
  },
  {
    icon: <Bot className="w-8 h-8 text-primary" />,
    title: "Conversational Editing",
    description: "Chat with your AI assistant to edit, rewrite, and brainstorm in real-time, just like working with a human partner.",
  },
  {
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    title: "Humanize Content",
    description: "Refine AI-generated text to have a more natural, human-like tone and style, ensuring your content is authentic.",
  },
  {
    icon: <Settings className="w-8 h-8 text-primary" />,
    title: "Fine-Tune Your AI",
    description: "Train the AI on your own writing to create a personalized assistant that perfectly matches your unique voice and style.",
  },
  {
    icon: <FileText className="w-8 h-8 text-primary" />,
    title: "File-Based Context",
    description: "Upload documents, images, and other files to give your AI assistant rich context for your articles.",
  },
];

const FeatureShowcase = () => {
  const cardVariants = {
    offscreen: {
      y: 50,
      opacity: 0,
    },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 0.8,
      },
    },
  };

  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            A Smarter Way to Write
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Mithoo is packed with powerful features to supercharge your content creation workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.5 }}
              variants={cardVariants}
              custom={index}
            >
              <Card className="h-full text-center bg-card/50 backdrop-blur-sm border-border/50 shadow-subtle hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;