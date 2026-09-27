package com.quannho.pos.media;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
public class ImageUploadController {
    private final ImageUploadService service;

    public ImageUploadController(ImageUploadService service) {
        this.service = service;
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file) {
        UploadedImage image = service.upload(file);
        return Map.of("url", image.url(), "publicId", image.publicId());
    }
}
