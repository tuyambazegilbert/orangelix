import { useTheme } from '@/hooks/use-theme';
import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'dark' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[#0b101d]/95 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-orange-500/40 group-[.toaster]:shadow-2xl group-[.toaster]:shadow-orange-950/70 group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:font-sans group-[.toaster]:flex group-[.toaster]:items-center group-[.toaster]:gap-3',
          description: 'group-[.toast]:text-slate-300 group-[.toast]:text-xs',
          actionButton:
            'group-[.toast]:bg-gradient-to-r group-[.toast]:from-orange-500 group-[.toast]:to-yellow-500 group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5',
          cancelButton:
            'group-[.toast]:bg-slate-800 group-[.toast]:text-slate-300 group-[.toast]:font-semibold group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5',
          success: '!border-emerald-500/40 !bg-[#071714]/95 !text-emerald-300',
          error: '!border-rose-500/40 !bg-[#1c0b10]/95 !text-rose-300',
          warning: '!border-amber-500/40 !bg-[#1b1207]/95 !text-amber-300',
          info: '!border-orange-500/40 !bg-[#1a0f0a]/95 !text-orange-300',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
