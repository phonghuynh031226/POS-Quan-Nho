package com.quannho.pos.media;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@Service
public class ImageUploadService {
    static final long MAX_IMAGE_SIZE = 2L * 1024 * 1024;

    private final ImageStorage storage;

    public ImageUploadService(ImageStorage storage) {
        this.storage = storage;
    }

    public UploadedImage upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file is required");
        }
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only image files are accepted");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image must not exceed 2MB");
        }

        try {
            return storage.upload(file);
        } catch (IOException | RuntimeException error) {
            if (error instanceof ResponseStatusException responseStatusException) {
                throw responseStatusException;
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not upload image", error);
        }
    }
}
