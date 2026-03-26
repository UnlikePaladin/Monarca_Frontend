/*Defines and exports a simple PDF document component using the @react-pdf/renderer library. It creates a set of styles with StyleSheet.create, defining layout properties for the page and its sections. The MyDocument component returns a Document containing a single A4-sized Page with a row layout and a light gray background. Inside the page, there are two View sections, each styled with margin and padding, displaying basic text content ("Section #1" and "Section #2"). This component can be used to generate or render a PDF file within a React application.*/

import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#E4E4E4",
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
});

// Create Document Component
const MyDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text>Section #1</Text>
      </View>
      <View style={styles.section}>
        <Text>Section #2</Text>
      </View>
    </Page>
  </Document>
);

export default MyDocument;
