Add-Type -AssemblyName System.Drawing

function Create-AppIcon {
    param(
        [int]$Size,
        [string]$Path
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background color (Dark emerald / Slate)
    $bgColor = [System.Drawing.Color]::FromArgb(255, 11, 15, 25)
    $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($bgBrush, 0, 0, $Size, $Size)

    # Outer circle (Emerald accent)
    $margin = [int]($Size * 0.08)
    $circleSize = $Size - ($margin * 2)
    $circleColor = [System.Drawing.Color]::FromArgb(255, 5, 150, 105)
    $circleBrush = New-Object System.Drawing.SolidBrush($circleColor)
    $g.FillEllipse($circleBrush, $margin, $margin, $circleSize, $circleSize)

    # Inner Ball (White / Light)
    $ballMargin = [int]($Size * 0.16)
    $ballSize = $Size - ($ballMargin * 2)
    $ballColor = [System.Drawing.Color]::FromArgb(255, 248, 250, 252)
    $ballBrush = New-Object System.Drawing.SolidBrush($ballColor)
    $g.FillEllipse($ballBrush, $ballMargin, $ballMargin, $ballSize, $ballSize)

    # Ball Center Pentagon (Dark Slate)
    $cx = $Size / 2
    $cy = $Size / 2
    $r = $Size * 0.16

    $pts = @()
    for ($i = 0; $i -lt 5; $i++) {
        $angle = ($i * 72 - 90) * [Math]::PI / 180
        $px = $cx + $r * [Math]::Cos($angle)
        $py = $cy + $r * [Math]::Sin($angle)
        $pts += New-Object System.Drawing.PointF($px, $py)
    }

    $darkColor = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)
    $darkBrush = New-Object System.Drawing.SolidBrush($darkColor)
    $g.FillPolygon($darkBrush, $pts)

    # Lines radiating to seams
    $pen = New-Object System.Drawing.Pen($darkColor, [float]($Size * 0.025))
    for ($i = 0; $i -lt 5; $i++) {
        $angle = ($i * 72 - 90) * [Math]::PI / 180
        $outerR = $Size * 0.34
        $ox = $cx + $outerR * [Math]::Cos($angle)
        $oy = $cy + $outerR * [Math]::Sin($angle)
        $g.DrawLine($pen, $pts[$i].X, $pts[$i].Y, [float]$ox, [float]$oy)
    }

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created $Path ($Size x $Size)"
}

Create-AppIcon -Size 192 -Path "public\icon-192.png"
Create-AppIcon -Size 512 -Path "public\icon-512.png"
Create-AppIcon -Size 180 -Path "public\apple-touch-icon.png"
