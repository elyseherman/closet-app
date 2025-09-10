import { useEffect, useState, useCallback } from "react";
import { SafeAreaView, View, FlatList, Text, Image, TouchableOpacity, TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";

type ClothingItem = {
  id: number;
  filename: string;
  url: string;
  category?: string;
  subcategory?: string;
  color_base?: string;
  formality?: string;
  season?: string;
};

export default function ClosetScreen() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [filter, setFilter] = useState<{ category?: string; }>({});
  const [search, setSearch] = useState("");

  
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
    console.log(`TEST URI: ${uri}`)
    const processedUri = await uploadImage(uri)
    if (processedUri) {
      console.log(processedUri)
  
    }
  }
  
    };
  
    const uploadImage = async (uri: string) => {
    const formData = new FormData();
  
    formData.append("file", {
      uri,
      name: "test.jpg",
      type: "image/jpeg",
    } as any);
  
    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData
      });
  
      const data = await response.json();
      console.log("Upload success:", data);
      await fetchCloset();

      return data.url;
      
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const fetchCloset = useCallback(async () => {
  const params = new URLSearchParams({ ...filter, search } as any).toString();
  const res = await fetch(`http://127.0.0.1:8000/closet?${params}`);
  const data = await res.json();
  setItems(data);
}, [filter, search]);


useEffect(() => {
  fetchCloset();
}, [fetchCloset, filter, search]);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      
      <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: "#ddd" }}>
        {/* Search Bar */}
        <TextInput
          placeholder="Search items..."
          value={search}
          onChangeText={setSearch}
          style={{
            backgroundColor: "#f0f0f0",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            marginBottom: 10,
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
  {/* Left side: filter buttons */}
  <View style={{ flexDirection: "row", flexWrap: "wrap", flex: 1 }}>
    {["Tops", "Bottoms", "Shoes", "Dresses"].map((label, idx) => (
      <TouchableOpacity
        key={idx}
        style={{
          backgroundColor: "#eee",
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 8,
          marginRight: 8,
          marginBottom: 8,
        }}
        onPress={() => {
          setFilter(label === "All" ? {} : { category: label.toLowerCase() });
        }}
      >
        <Text>{label}</Text>
      </TouchableOpacity>
    ))}
  </View>

  {/* Right side: fixed button */}
  <TouchableOpacity
    style={{
      backgroundColor: "#eee",
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 8,
          marginRight: 8,
          marginBottom: 8,
    }}
    onPress={pickImage}
  >
    <Text style={{ color: "#fff" }}>+</Text>
  </TouchableOpacity>
</View>

      </View>

      <FlatList
  data={
    items.length % 2 === 1
      ? [...items, { id: "empty", url: "", isPlaceholder: true }]
      : items
  }
  keyExtractor={(item) => item.id.toString()}
  numColumns={2}
  contentContainerStyle={{ padding: 10 }}
  renderItem={({ item }) => {
    if ((item as any).isPlaceholder) {
      return <View style={{ flex: 1, margin: 5 }} />; // invisible filler cell
    }

    return (
      <View style={{ flex: 1, margin: 5, alignItems: "center" }}>
        <Image
          source={{ uri: item.url }}
          style={{ width: "100%", height: 150, borderRadius: 10 }}
          resizeMode="cover"
        />
      </View>
    );
  }}
  ListEmptyComponent={
    <Text style={{ textAlign: "center", marginTop: 20 }}>
      No items found.
    </Text>
  }
/>

    </SafeAreaView>
  );
}
