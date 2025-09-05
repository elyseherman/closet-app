import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Button, Image, View } from "react-native";

export default function Upload() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    // Launch image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    // If not cancelled, store the URI
    if (!result.canceled && result.assets.length > 0) {
  const uri = result.assets[0].uri;
  setImageUri(uri);
  uploadImage(uri)
}

  };

  const uploadImage = async (uri: string) => {
  const formData = new FormData();

  formData.append("file", {
    uri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as any);

  try {
    const response = await fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    console.log("Upload success:", data);
  } catch (error) {
    console.error("Upload error:", error);
  }
};


  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Pick an image" onPress={pickImage} />
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{ width: 200, height: 200, marginTop: 20 }}
        />
      )}
    </View>
  );
}
