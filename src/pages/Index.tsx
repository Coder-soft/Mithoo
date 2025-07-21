import { Header } from "@/components/Header";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Editor } from "@/components/Editor";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-[calc(100vh-4rem)] flex">
        <ChatSidebar />
        <Editor />
      </div>
    </div>
  );
};

export default Index;
