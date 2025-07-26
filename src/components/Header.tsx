import { PenTool, LogOut, Plus, Save, Pilcrow, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FineTuningPanel } from "./FineTuningPanel";
import { UserPreferences } from "./UserPreferences";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Article } from "@/hooks/useArticle";

type HumanizeMode = 'subtle' | 'balanced' | 'strong' | 'stealth';

interface HeaderProps {
  onCreateArticle: () => void;
  currentArticle: Article | null;
  title: string;
  onTitleChange: (newTitle: string) => void;
  onSave: () => void;
  wordCount: number;
  charCount: number;
  onHumanize: (mode: HumanizeMode) => void;
  isHumanizing: boolean;
}

export const Header = ({
  onCreateArticle,
  currentArticle,
  title,
  onTitleChange,
  onSave,
  wordCount,
  charCount,
  onHumanize,
  isHumanizing,
}: HeaderProps) => {
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <PenTool className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Mithoo</h1>
          </div>
          {currentArticle && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Article Title..."
                className="text-xl font-semibold border-none bg-transparent focus-visible:ring-0 p-0 h-auto w-full max-w-md"
              />
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {currentArticle ? (
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Pilcrow className="w-4 h-4" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="font-mono text-sm">T</span>
                <span>{charCount} characters</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isHumanizing}>
                    {isHumanizing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Humanize
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-40">
                  {(['subtle', 'balanced', 'strong', 'stealth'] as HumanizeMode[]).map(m => (
                    <Button key={m} variant="ghost" className="w-full justify-start" onClick={() => onHumanize(m)} disabled={isHumanizing}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
              <Button size="sm" onClick={onSave}><Save className="w-4 h-4 mr-2" />Save</Button>
            </div>
          ) : (
            <Button onClick={onCreateArticle} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Article
            </Button>
          )}
          
          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center space-x-1">
            <UserPreferences />
            <FineTuningPanel />
          </div>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata.full_name || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};