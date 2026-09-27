package com.quannho.pos.media;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@FunctionalInterface
public interface ImageStorage {
    UploadedImage upload(MultipartFile file) throws IOException;
}
