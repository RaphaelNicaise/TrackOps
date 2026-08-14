import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <img 
            src="/trackopslogo.png" 
            alt="TrackOps Logo" 
            className="h-12 md:h-14 w-auto mb-6 object-contain" 
          />
          <p className="text-muted-foreground mt-2">
            Plataforma B2B de Gestión de Flotas
          </p>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Usa un correo de demostración (admin@test.com, empresa@test.com, chofer@test.com) y cualquier contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                await signIn("credentials", formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@test.com"
                  required
                  className="bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="bg-card"
                />
              </div>
              <Button type="submit" className="w-full">
                Entrar al sistema
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
