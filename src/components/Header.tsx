import { LogOut, Plus } from "lucide-react";
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

interface HeaderProps {
  onCreateArticle?: () => void;
}

export const Header = ({ onCreateArticle }: HeaderProps) => {
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-lg">🦜</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Mithoo</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {onCreateArticle && (
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