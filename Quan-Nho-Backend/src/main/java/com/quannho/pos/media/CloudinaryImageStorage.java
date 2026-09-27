package com.quannho.pos.media;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;

@Component
public class CloudinaryImageStorage implements ImageStorage {
    private final Cloudinary cloudinary;
    private final boolean configured;

    public CloudinaryImageStorage(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret) {
        configured = !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
        cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true));
    }

    @Override
    public UploadedImage upload(MultipartFile file) throws IOException {
        if (!configured) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cloudinary is not configured");
        }

        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "quan-nho/products",
                "resource_type", "image",
                "use_filename", true,
                "unique_filename", true));
        return new UploadedImage(String.valueOf(result.get("secure_url")), String.valueOf(result.get("public_id")));
    }
}
