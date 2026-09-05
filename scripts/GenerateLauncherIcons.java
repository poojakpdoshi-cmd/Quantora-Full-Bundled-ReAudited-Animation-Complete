import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Ellipse2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;

public class GenerateLauncherIcons {
    public static void main(String[] args) throws Exception {
        File srcFile = new File("apps/mobile/public/quantora-logo.png");
        if (!srcFile.exists()) {
            srcFile = new File("apps/mobile/public/logo.png");
        }
        System.out.println("Source logo: " + srcFile.getAbsolutePath());
        BufferedImage srcImage = ImageIO.read(srcFile);

        // Launcher Densities
        int[][] densities = {
            { 48, 108 },  // mdpi
            { 72, 162 },  // hdpi
            { 96, 216 },  // xhdpi
            { 144, 324 }, // xxhdpi
            { 192, 432 }  // xxxhdpi
        };
        String[] densityNames = { "mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi" };

        String resBasePath = "apps/mobile/android/app/src/main/res";

        for (int i = 0; i < densityNames.length; i++) {
            String dirName = densityNames[i];
            int iconSize = densities[i][0];
            int fgSize = densities[i][1];

            File dir = new File(resBasePath, dirName);
            if (!dir.exists()) dir.mkdirs();

            // 1. Standard ic_launcher.png (Rounded rectangle on dark brand background)
            BufferedImage launcher = new BufferedImage(iconSize, iconSize, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = launcher.createGraphics();
            setHighQuality(g);
            g.setColor(new Color(0x00, 0x00, 0x08));
            int arc = (int)(iconSize * 0.22);
            g.fill(new RoundRectangle2D.Float(0, 0, iconSize, iconSize, arc, arc));
            int pad = (int)(iconSize * 0.10);
            g.drawImage(srcImage, pad, pad, iconSize - 2 * pad, iconSize - 2 * pad, null);
            g.dispose();
            ImageIO.write(launcher, "PNG", new File(dir, "ic_launcher.png"));

            // 2. Round ic_launcher_round.png (Circular mask on dark brand background)
            BufferedImage launcherRound = new BufferedImage(iconSize, iconSize, BufferedImage.TYPE_INT_ARGB);
            Graphics2D gr = launcherRound.createGraphics();
            setHighQuality(gr);
            gr.setColor(new Color(0x00, 0x00, 0x08));
            gr.fill(new Ellipse2D.Float(0, 0, iconSize, iconSize));
            int rPad = (int)(iconSize * 0.12);
            gr.drawImage(srcImage, rPad, rPad, iconSize - 2 * rPad, iconSize - 2 * rPad, null);
            gr.dispose();
            ImageIO.write(launcherRound, "PNG", new File(dir, "ic_launcher_round.png"));

            // 3. Adaptive Foreground ic_launcher_foreground.png
            BufferedImage fg = new BufferedImage(fgSize, fgSize, BufferedImage.TYPE_INT_ARGB);
            Graphics2D gfg = fg.createGraphics();
            setHighQuality(gfg);
            int fgPad = (int)(fgSize * 0.20);
            gfg.drawImage(srcImage, fgPad, fgPad, fgSize - 2 * fgPad, fgSize - 2 * fgPad, null);
            gfg.dispose();
            ImageIO.write(fg, "PNG", new File(dir, "ic_launcher_foreground.png"));
        }

        // 4. Splash Screens (Portrait & Landscape)
        int[][] splashSizes = {
            { 480, 800, 0 },   // drawable/splash.png
            { 320, 480, 1 },   // drawable-port-mdpi
            { 480, 800, 2 },   // drawable-port-hdpi
            { 720, 1280, 3 },  // drawable-port-xhdpi
            { 960, 1600, 4 },  // drawable-port-xxhdpi
            { 1280, 1920, 5 }, // drawable-port-xxxhdpi
            { 480, 320, 6 },   // drawable-land-mdpi
            { 800, 480, 7 },   // drawable-land-hdpi
            { 1280, 720, 8 },  // drawable-land-xhdpi
            { 1600, 960, 9 },  // drawable-land-xxhdpi
            { 1920, 1280, 10 } // drawable-land-xxxhdpi
        };
        String[] splashDirs = {
            "drawable",
            "drawable-port-mdpi",
            "drawable-port-hdpi",
            "drawable-port-xhdpi",
            "drawable-port-xxhdpi",
            "drawable-port-xxxhdpi",
            "drawable-land-mdpi",
            "drawable-land-hdpi",
            "drawable-land-xhdpi",
            "drawable-land-xxhdpi",
            "drawable-land-xxxhdpi"
        };

        for (int i = 0; i < splashDirs.length; i++) {
            int w = splashSizes[i][0];
            int h = splashSizes[i][1];
            File dir = new File(resBasePath, splashDirs[i]);
            if (!dir.exists()) dir.mkdirs();

            BufferedImage splash = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
            Graphics2D gs = splash.createGraphics();
            setHighQuality(gs);
            gs.setColor(new Color(0x00, 0x00, 0x08));
            gs.fillRect(0, 0, w, h);

            int logoMax = (int)(Math.min(w, h) * 0.40);
            int logoW = logoMax;
            int logoH = logoMax;
            int x = (w - logoW) / 2;
            int y = (h - logoH) / 2;
            gs.drawImage(srcImage, x, y, logoW, logoH, null);
            gs.dispose();

            ImageIO.write(splash, "PNG", new File(dir, "splash.png"));
        }

        System.out.println("ALL NEXORA LAUNCHER ICONS AND SPLASH SCREENS GENERATED SUCCESSFULLY.");
    }

    private static void setHighQuality(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ALPHA_INTERPOLATION, RenderingHints.VALUE_ALPHA_INTERPOLATION_QUALITY);
    }
}
