
// thumb_face: face rectangles via Apple Vision. Usage: thumb_face <image> [...]
// Prints JSON: [{"path":..,"w":..,"h":..,"faces":[[x,y,w,h,confidence],...]}] (pixels, top-left origin)
import Foundation
import Vision
import ImageIO
import CoreGraphics
var out: [[String: Any]] = []
for path in CommandLine.arguments.dropFirst() {
    let url = URL(fileURLWithPath: path)
    guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
          let raw = CGImageSourceCreateImageAtIndex(src, 0, nil) else { out.append(["path": path, "error": "load"]); continue }
    let W = raw.width, H = raw.height
    // flatten transparency onto mid grey so cutouts read like photos
    let cs = CGColorSpaceCreateDeviceRGB()
    guard let cg = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                             bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { out.append(["path": path, "error": "ctx"]); continue }
    cg.setFillColor(CGColor(red: 0.5, green: 0.5, blue: 0.5, alpha: 1))
    cg.fill(CGRect(x: 0, y: 0, width: W, height: H))
    cg.draw(raw, in: CGRect(x: 0, y: 0, width: W, height: H))
    guard let img = cg.makeImage() else { out.append(["path": path, "error": "img"]); continue }
    let req = VNDetectFaceRectanglesRequest()
    let handler = VNImageRequestHandler(cgImage: img, options: [:])
    do { try handler.perform([req]) } catch { out.append(["path": path, "error": "\(error)"]); continue }
    var faces: [[Double]] = []
    for f in (req.results ?? []) {
        let b = f.boundingBox
        faces.append([Double(b.minX) * Double(W), (1.0 - Double(b.maxY)) * Double(H),
                      Double(b.width) * Double(W), Double(b.height) * Double(H), Double(f.confidence)])
    }
    out.append(["path": path, "w": W, "h": H, "faces": faces])
}
let data = try! JSONSerialization.data(withJSONObject: out, options: [])
print(String(data: data, encoding: .utf8)!)
